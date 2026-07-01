import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser, jsonError, handleApiError } from "@/lib/api";

interface Params {
  params: { candidateJobId: string };
}

// POST — send polished profile for client review (moves INCOMING → PRESENTED)
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

    // Only meaningful from INCOMING; if already presented or beyond, no-op success.
    if (cj.stage === "INCOMING") {
      await prisma.candidateJob.update({
        where: { id: params.candidateJobId },
        data: { stage: "PRESENTED" },
      });
    }

    return NextResponse.json({ success: true, stage: "PRESENTED" });
  } catch (error) {
    return handleApiError(error);
  }
}
