import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser, jsonError, handleApiError, parseJson } from "@/lib/api";
import { computeScores } from "@/lib/scoring";
import { buildInitialResumeContent } from "@/lib/resume-content";
import { toCandidateProfile } from "@/lib/candidate-job";
import type { ResumeContent } from "@/types/resume";
import type { KanbanCard, PipelineStage } from "@/types/kanban";

// GET — every candidate card for the signed-in vendor, aggregated across ALL
// their jobs (the dossier board no longer filters by a single job). Scores are
// computed live from each candidate's current resume content, per their job.
export async function GET() {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;
    const user = auth;
    if (user.role !== "VENDOR") return jsonError("Forbidden", 403);

    const candidateJobs = await prisma.candidateJob.findMany({
      where: { vendorUserId: user.id },
      include: { candidate: true, resume: true, vendor: true, job: true },
      orderBy: { updatedAt: "desc" },
    });

    const cards: KanbanCard[] = candidateJobs.map((cj) => {
      const requiredSkills = parseJson<string[]>(cj.job.requiredSkills, []);
      const content: ResumeContent = cj.resume
        ? parseJson<ResumeContent>(cj.resume.content, { sections: [] })
        : buildInitialResumeContent(
            toCandidateProfile(cj.candidate),
            cj.recruiterNotes
          );
      const { jobMatchScore, qualityScore } = computeScores(
        content,
        requiredSkills,
        cj.job.requirements
      );

      return {
        candidateJobId: cj.id,
        candidateId: cj.candidateId,
        name: `${cj.candidate.firstName} ${cj.candidate.lastName}`,
        title: cj.candidate.currentTitle,
        jobTitle: cj.job.title,
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
