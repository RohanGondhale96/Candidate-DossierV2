import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser, jsonError, handleApiError, parseJson } from "@/lib/api";
import type { ResumeContent } from "@/types/resume";

interface Params {
  params: { candidateJobId: string; versionNumber: string };
}

// POST — restore a previous version into the live resume (creates a new version)
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireUser("VENDOR");
    if (auth instanceof NextResponse) return auth;
    const user = auth;

    const versionNumber = Number(params.versionNumber);
    if (!Number.isFinite(versionNumber))
      return jsonError("Invalid version number", 400);

    const cj = await prisma.candidateJob.findUnique({
      where: { id: params.candidateJobId },
      select: { vendorUserId: true },
    });
    if (!cj) return jsonError("Candidate not found", 404);
    if (cj.vendorUserId !== user.id) return jsonError("Forbidden", 403);

    const target = await prisma.resumeVersion.findUnique({
      where: {
        candidateJobId_versionNumber: {
          candidateJobId: params.candidateJobId,
          versionNumber,
        },
      },
    });
    if (!target) return jsonError("Version not found", 404);

    const result = await prisma.$transaction(async (tx) => {
      await tx.resumeData.update({
        where: { candidateJobId: params.candidateJobId },
        data: {
          content: target.content,
          templateId: target.templateId,
          accentColor: target.accentColor,
          fontFamily: target.fontFamily,
          logoUrl: target.logoUrl,
          logoHidden: target.logoHidden,
          jobMatchScore: target.jobMatchScore,
          qualityScore: target.qualityScore,
        },
      });

      const last = await tx.resumeVersion.findFirst({
        where: { candidateJobId: params.candidateJobId },
        orderBy: { versionNumber: "desc" },
      });
      const newVersionNumber = (last?.versionNumber ?? 0) + 1;

      await tx.resumeVersion.create({
        data: {
          candidateJobId: params.candidateJobId,
          versionNumber: newVersionNumber,
          content: target.content,
          templateId: target.templateId,
          accentColor: target.accentColor,
          fontFamily: target.fontFamily,
          logoUrl: target.logoUrl,
          logoHidden: target.logoHidden,
          jobMatchScore: target.jobMatchScore,
          qualityScore: target.qualityScore,
          createdBy: user.id,
          changeNote: `Restored from version ${versionNumber}`,
        },
      });

      return { newVersionNumber };
    });

    const content = parseJson<ResumeContent>(target.content, { sections: [] });

    return NextResponse.json({
      success: true,
      restoredFrom: versionNumber,
      newVersionNumber: result.newVersionNumber,
      resume: {
        content,
        templateId: target.templateId,
        accentColor: target.accentColor,
        fontFamily: target.fontFamily,
        logoUrl: target.logoUrl,
        logoHidden: target.logoHidden,
        jobMatchScore: target.jobMatchScore,
        qualityScore: target.qualityScore,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
