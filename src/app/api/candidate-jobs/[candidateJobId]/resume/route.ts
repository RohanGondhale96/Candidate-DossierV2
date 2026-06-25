import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser, jsonError, handleApiError, parseJson } from "@/lib/api";
import { saveResumeSchema } from "@/lib/validation";
import {
  loadCandidateJob,
  toCandidateProfile,
} from "@/lib/candidate-job";
import { buildInitialResumeContent } from "@/lib/resume-content";
import { DEFAULT_ACCENT, DEFAULT_TEMPLATE, DEFAULT_FONT } from "@/types/resume";
import type { ResumeContent } from "@/types/resume";
import type { PipelineStage } from "@/lib/constants";

interface Params {
  params: { candidateJobId: string };
}

// GET — current resume data (builds initial content if none exists yet)
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;
    const user = auth;

    const cj = await loadCandidateJob(params.candidateJobId);
    if (!cj) return jsonError("Candidate not found", 404);

    // Authorization
    if (user.role === "VENDOR") {
      if (cj.vendorUserId !== user.id) return jsonError("Forbidden", 403);
    } else {
      // CLIENT — must belong to the job's client org and not be SHORTLISTED
      if (cj.job.clientId !== user.organizationId)
        return jsonError("Forbidden", 403);
      if (cj.stage === "SHORTLISTED") return jsonError("Forbidden", 403);
    }

    const hasExistingResume = !!cj.resume;
    const content: ResumeContent = cj.resume
      ? parseJson<ResumeContent>(cj.resume.content, { sections: [] })
      : buildInitialResumeContent(
          toCandidateProfile(cj.candidate),
          cj.recruiterNotes
        );

    return NextResponse.json({
      candidateJobId: cj.id,
      candidateName: `${cj.candidate.firstName} ${cj.candidate.lastName}`,
      jobTitle: cj.job.title,
      clientName: cj.job.client.name,
      stage: cj.stage as PipelineStage,
      recruiterNotes: cj.recruiterNotes,
      job: {
        description: cj.job.description,
        requirements: cj.job.requirements,
        requiredSkills: parseJson<string[]>(cj.job.requiredSkills, []),
        location: cj.job.location,
        salaryRange: cj.job.salaryRange,
        openPositions: cj.job.openPositions,
      },
      hasExistingResume,
      resume: {
        templateId: cj.resume?.templateId ?? DEFAULT_TEMPLATE,
        accentColor: cj.resume?.accentColor ?? DEFAULT_ACCENT,
        // Empty/unset font falls back to Roboto (the app-wide default).
        fontFamily: cj.resume?.fontFamily || DEFAULT_FONT,
        logoUrl: cj.resume?.logoUrl ?? null,
        logoHidden: cj.resume?.logoHidden ?? false,
        content,
        jobMatchScore: cj.resume?.jobMatchScore ?? null,
        qualityScore: cj.resume?.qualityScore ?? null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT — save resume (upsert ResumeData + create a new version)
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const auth = await requireUser("VENDOR");
    if (auth instanceof NextResponse) return auth;
    const user = auth;

    const cj = await loadCandidateJob(params.candidateJobId);
    if (!cj) return jsonError("Candidate not found", 404);
    if (cj.vendorUserId !== user.id) return jsonError("Forbidden", 403);

    const body = saveResumeSchema.parse(await req.json());
    const contentStr = JSON.stringify(body.content);

    const result = await prisma.$transaction(async (tx) => {
      // Upsert resume data
      const resume = await tx.resumeData.upsert({
        where: { candidateJobId: cj.id },
        create: {
          candidateJobId: cj.id,
          templateId: body.templateId,
          accentColor: body.accentColor,
          fontFamily: body.fontFamily ?? "",
          logoUrl: body.logoUrl ?? null,
          logoHidden: body.logoHidden ?? false,
          content: contentStr,
          jobMatchScore: body.jobMatchScore ?? null,
          qualityScore: body.qualityScore ?? null,
        },
        update: {
          templateId: body.templateId,
          accentColor: body.accentColor,
          fontFamily: body.fontFamily ?? "",
          logoUrl: body.logoUrl ?? null,
          logoHidden: body.logoHidden ?? false,
          content: contentStr,
          jobMatchScore: body.jobMatchScore ?? null,
          qualityScore: body.qualityScore ?? null,
        },
      });

      // Persist recruiter notes onto the candidate-job if provided
      if (body.recruiterNotes !== undefined) {
        await tx.candidateJob.update({
          where: { id: cj.id },
          data: { recruiterNotes: body.recruiterNotes },
        });
      }

      // Next version number
      const last = await tx.resumeVersion.findFirst({
        where: { candidateJobId: cj.id },
        orderBy: { versionNumber: "desc" },
      });
      const versionNumber = (last?.versionNumber ?? 0) + 1;

      const version = await tx.resumeVersion.create({
        data: {
          candidateJobId: cj.id,
          versionNumber,
          content: contentStr,
          templateId: body.templateId,
          accentColor: body.accentColor,
          fontFamily: body.fontFamily ?? "",
          logoUrl: body.logoUrl ?? null,
          logoHidden: body.logoHidden ?? false,
          jobMatchScore: body.jobMatchScore ?? null,
          qualityScore: body.qualityScore ?? null,
          createdBy: user.id,
          changeNote: body.changeNote ?? null,
        },
      });

      return { resume, versionNumber: version.versionNumber };
    });

    return NextResponse.json({
      success: true,
      versionNumber: result.versionNumber,
      savedAt: result.resume.updatedAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
