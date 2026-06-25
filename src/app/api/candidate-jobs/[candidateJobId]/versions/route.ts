import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser, jsonError, handleApiError } from "@/lib/api";

interface Params {
  params: { candidateJobId: string };
}

// GET — list resume versions (newest first)
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireUser("VENDOR");
    if (auth instanceof NextResponse) return auth;
    const user = auth;

    const cj = await prisma.candidateJob.findUnique({
      where: { id: params.candidateJobId },
      select: { vendorUserId: true },
    });
    if (!cj) return jsonError("Candidate not found", 404);
    if (cj.vendorUserId !== user.id) return jsonError("Forbidden", 403);

    const versions = await prisma.resumeVersion.findMany({
      where: { candidateJobId: params.candidateJobId },
      orderBy: { versionNumber: "desc" },
      select: {
        id: true,
        versionNumber: true,
        changeNote: true,
        templateId: true,
        accentColor: true,
        jobMatchScore: true,
        qualityScore: true,
        createdAt: true,
        createdBy: true,
      },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    return handleApiError(error);
  }
}
