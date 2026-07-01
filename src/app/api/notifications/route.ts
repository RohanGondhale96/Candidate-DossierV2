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

    const candidateJobs = await prisma.candidateJob.findMany({
      where: {
        vendorUserId: user.id,
        ...(filterCandidateJobId ? { id: filterCandidateJobId } : {}),
      },
      include: {
        candidate: true,
        job: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const items: Array<{
      candidateJobId: string;
      candidateName: string;
      jobTitle: string;
      unreadCount: number;
      lastCommentPreview: string;
      lastCommentAt: string;
    }> = [];
    let total = 0;

    for (const cj of candidateJobs) {
      const clientComments = cj.comments.filter((c) => c.user.role === "CLIENT");
      const unreadCount = clientComments.filter(
        (c) => !cj.vendorLastReadAt || c.createdAt > cj.vendorLastReadAt
      ).length;

      if (unreadCount > 0) {
        const latest = clientComments[0];
        items.push({
          candidateJobId: cj.id,
          candidateName: `${cj.candidate.firstName} ${cj.candidate.lastName}`,
          jobTitle: cj.job.title,
          unreadCount,
          lastCommentPreview: latest?.content.slice(0, 100) ?? "",
          lastCommentAt: latest?.createdAt.toISOString() ?? "",
        });
        total += unreadCount;
      }
    }

    items.sort(
      (a, b) =>
        new Date(b.lastCommentAt).getTime() - new Date(a.lastCommentAt).getTime()
    );

    return NextResponse.json({ total, items });
  } catch (e) {
    console.error(e);
    return jsonError("Internal server error", 500);
  }
}
