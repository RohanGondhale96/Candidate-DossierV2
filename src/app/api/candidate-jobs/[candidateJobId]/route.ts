import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser, jsonError, handleApiError } from "@/lib/api";
import { VALID_TRANSITIONS, isValidStage } from "@/lib/constants";
import type { PipelineStage } from "@/lib/constants";

interface Params {
  params: { candidateJobId: string };
}

const patchSchema = z.object({
  stage: z.string().refine(isValidStage, "Invalid stage"),
});

// PATCH — move a candidate to a new pipeline stage (enforces valid transitions).
// Moving to REJECTED records the stage it was rejected from.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;
    const user = auth;

    const cj = await prisma.candidateJob.findUnique({
      where: { id: params.candidateJobId },
      include: { job: true },
    });
    if (!cj) return jsonError("Candidate not found", 404);

    if (user.role === "VENDOR") {
      if (cj.vendorUserId !== user.id) return jsonError("Forbidden", 403);
    } else if (cj.job.clientId !== user.organizationId) {
      return jsonError("Forbidden", 403);
    }

    const { stage: newStage } = patchSchema.parse(await req.json());
    const current = cj.stage as PipelineStage;

    if (newStage === current) {
      return NextResponse.json({ success: true, stage: current });
    }

    if (!VALID_TRANSITIONS[current].includes(newStage)) {
      return jsonError(
        `Cannot move from ${current} to ${newStage}`,
        400
      );
    }

    // Track where a rejection happened; clear it when recovering from Rejected.
    let rejectedAtStageUpdate: { rejectedAtStage?: string | null } = {};
    if (newStage === "REJECTED") {
      rejectedAtStageUpdate = { rejectedAtStage: current };
    } else if (current === "REJECTED") {
      rejectedAtStageUpdate = { rejectedAtStage: null };
    }

    const updated = await prisma.candidateJob.update({
      where: { id: cj.id },
      data: {
        stage: newStage,
        ...rejectedAtStageUpdate,
      },
    });

    return NextResponse.json({
      success: true,
      stage: updated.stage,
      rejectedAtStage: updated.rejectedAtStage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
