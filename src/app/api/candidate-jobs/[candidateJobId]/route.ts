import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser, jsonError, handleApiError } from "@/lib/api";
import { VALID_TRANSITIONS, isValidStage } from "@/lib/constants";
import type { PipelineStage } from "@/lib/constants";
import { createNotification } from "@/lib/notifications";

interface Params {
  params: { candidateJobId: string };
}

const patchSchema = z.object({
  stage: z.string().refine(isValidStage, "Invalid stage"),
  notAFitReason: z.string().optional(),
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

    const { stage: newStage, notAFitReason } = patchSchema.parse(await req.json());
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

    // Track which stage the candidate was in when marked not a fit.
    let rejectedAtStageUpdate: { rejectedAtStage?: string | null; notAFitReason?: string | null } = {};
    if (newStage === "NOT_A_FIT") {
      rejectedAtStageUpdate = { rejectedAtStage: current, notAFitReason: notAFitReason ?? null };
    } else if (current === "NOT_A_FIT") {
      rejectedAtStageUpdate = { rejectedAtStage: null, notAFitReason: null };
    }

    const updated = await prisma.candidateJob.update({
      where: { id: cj.id },
      data: {
        stage: newStage,
        ...rejectedAtStageUpdate,
      },
    });

    // Notify the vendor when a client accepts or rejects a candidate
    if (
      user.role === "CLIENT" &&
      (newStage === "ACCEPTED" || newStage === "NOT_A_FIT")
    ) {
      createNotification({
        recipientId: cj.vendorUserId,
        actorId: user.id,
        type: newStage === "ACCEPTED" ? "STAGE_ACCEPTED" : "STAGE_NOT_A_FIT",
        candidateJobId: cj.id,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      stage: updated.stage,
      rejectedAtStage: updated.rejectedAtStage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
