import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser, jsonError } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;
    const user = auth;
    if (user.role !== "VENDOR") return jsonError("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const filterCandidateJobId = searchParams.get("candidateJobId");

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: user.id,
        readAt: null,
        ...(filterCandidateJobId ? { candidateJobId: filterCandidateJobId } : {}),
      },
      include: {
        candidateJob: { include: { candidate: true, job: true } },
        actor: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const items = notifications.map((n) => ({
      id: n.id,
      type: n.type as "COMMENT_ADDED" | "STAGE_ACCEPTED" | "STAGE_NOT_A_FIT",
      candidateJobId: n.candidateJobId,
      candidateName: `${n.candidateJob.candidate.firstName} ${n.candidateJob.candidate.lastName}`,
      jobTitle: n.candidateJob.job.title,
      actorName: n.actor.name,
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({ total: items.length, items });
  } catch (e) {
    console.error(e);
    return jsonError("Internal server error", 500);
  }
}
