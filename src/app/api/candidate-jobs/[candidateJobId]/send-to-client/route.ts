import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser, jsonError, handleApiError } from "@/lib/api";

interface Params {
  params: { candidateJobId: string };
}

// POST — send polished profile for client review (moves to IN_REVIEW)
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireUser("VENDOR");
    if (auth instanceof NextResponse) return auth;
    const user = auth;

    const cj = await prisma.candidateJob.findUnique({
      where: { id: params.candidateJobId },
      select: { vendorUserId: true, stage: true, resume: { select: { id: true } } },
    });
    if (!cj) return jsonError("Candidate not found", 404);
    if (cj.vendorUserId !== user.id) return jsonError("Forbidden", 403);
    if (!cj.resume)
      return jsonError("Save the resume before sending to client", 400);

    // Only meaningful from SHORTLISTED; if already sent or beyond, no-op success.
    if (cj.stage === "SHORTLISTED") {
      await prisma.candidateJob.update({
        where: { id: params.candidateJobId },
        data: { stage: "IN_REVIEW" },
      });
    }

    return NextResponse.json({ success: true, stage: "IN_REVIEW" });
  } catch (error) {
    return handleApiError(error);
  }
}
