import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser, jsonError, handleApiError } from "@/lib/api";

const bodySchema = z.object({
  candidates: z
    .array(
      z.object({
        candidateJobId: z.string(),
        candidateSummary: z.string().optional(),
      })
    )
    .min(1),
});

// POST — share multiple candidates with client (INCOMING → PRESENTED)
// Accepts an optional per-candidate candidateSummary (recruiter note).
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser("VENDOR");
    if (auth instanceof NextResponse) return auth;
    const user = auth;

    const { candidates } = bodySchema.parse(await req.json());
    const ids = candidates.map((c) => c.candidateJobId);

    const candidateJobs = await prisma.candidateJob.findMany({
      where: { id: { in: ids } },
      select: { id: true, vendorUserId: true, stage: true },
    });

    const forbidden = candidateJobs.find((cj) => cj.vendorUserId !== user.id);
    if (forbidden) return jsonError("Forbidden", 403);

    // Only transition candidates currently in INCOMING
    const toShare = candidateJobs.filter((cj) => cj.stage === "INCOMING");

    await Promise.all(
      toShare.map((cj) => {
        const note =
          candidates.find((c) => c.candidateJobId === cj.id)
            ?.candidateSummary ?? "";
        return prisma.candidateJob.update({
          where: { id: cj.id },
          data: {
            stage: "PRESENTED",
            candidateSummary: note.trim() || null,
          },
        });
      })
    );

    return NextResponse.json({ success: true, shared: toShare.length });
  } catch (error) {
    return handleApiError(error);
  }
}
