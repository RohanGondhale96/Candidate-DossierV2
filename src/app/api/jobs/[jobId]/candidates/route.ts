import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser, jsonError, handleApiError, parseJson } from "@/lib/api";
import { computeScores } from "@/lib/scoring";
import { buildInitialResumeContent } from "@/lib/resume-content";
import { toCandidateProfile } from "@/lib/candidate-job";
import type { ResumeContent } from "@/types/resume";
import type { KanbanCard, PipelineStage } from "@/types/kanban";

interface Params {
  params: { jobId: string };
}

// GET — candidate-job cards for a job.
//   Vendor: only their own candidates.
//   Client: all vendors' candidates that have reached review (not SHORTLISTED).
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;
    const user = auth;

    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      include: { vendorAssignments: true },
    });
    if (!job) return jsonError("Job not found", 404);

    if (user.role === "VENDOR") {
      const assigned = job.vendorAssignments.some(
        (a) => a.vendorId === user.organizationId
      );
      if (!assigned) return jsonError("Forbidden", 403);
    } else if (job.clientId !== user.organizationId) {
      return jsonError("Forbidden", 403);
    }

    const candidateJobs = await prisma.candidateJob.findMany({
      where: {
        jobId: params.jobId,
        ...(user.role === "VENDOR"
          ? { vendorUserId: user.id }
          : { stage: { not: "SHORTLISTED" } }),
      },
      include: { candidate: true, resume: true, vendor: true },
      orderBy: { updatedAt: "desc" },
    });

    const requiredSkills = parseJson<string[]>(job.requiredSkills, []);
    const requirements = job.requirements;

    const cards: KanbanCard[] = candidateJobs.map((cj) => {
      // Always score live from the candidate's current resume content (their
      // saved resume, or the initial content for Shortlisted candidates) so the
      // numbers match everywhere — board, client dashboard, review page, builder.
      const content: ResumeContent = cj.resume
        ? parseJson<ResumeContent>(cj.resume.content, { sections: [] })
        : buildInitialResumeContent(
            toCandidateProfile(cj.candidate),
            cj.recruiterNotes
          );
      const { jobMatchScore, qualityScore } = computeScores(
        content,
        requiredSkills,
        requirements
      );

      return {
        candidateJobId: cj.id,
        candidateId: cj.candidateId,
        name: `${cj.candidate.firstName} ${cj.candidate.lastName}`,
        title: cj.candidate.currentTitle,
        jobTitle: job.title,
        location: cj.candidate.location,
        noticePeriod: cj.candidate.noticePeriod,
        expectedSalary: cj.candidate.expectedSalary,
        yearsOfExperience: cj.candidate.yearsOfExperience,
        skills: parseJson<string[]>(cj.candidate.skills, []),
        stage: cj.stage as PipelineStage,
        rejectedAtStage: (cj.rejectedAtStage as PipelineStage | null) ?? null,
        jobMatchScore,
        qualityScore,
        vendorName: cj.vendor.name,
      };
    });

    return NextResponse.json({ cards });
  } catch (error) {
    return handleApiError(error);
  }
}
