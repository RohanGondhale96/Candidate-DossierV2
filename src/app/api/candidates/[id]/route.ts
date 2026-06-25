import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser, jsonError, handleApiError } from "@/lib/api";
import { toCandidateProfile } from "@/lib/candidate-job";

interface Params {
  params: { id: string };
}

// GET — full structured candidate profile (for the Kanban detail drawer).
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;

    const candidate = await prisma.candidate.findUnique({
      where: { id: params.id },
    });
    if (!candidate) return jsonError("Candidate not found", 404);

    return NextResponse.json({ candidate: toCandidateProfile(candidate) });
  } catch (error) {
    return handleApiError(error);
  }
}
