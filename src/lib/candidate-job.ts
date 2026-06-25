import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/api";
import type { CandidateProfile } from "@/types/candidate";
import type {
  ExperienceEntry,
  EducationEntry,
  CertificationEntry,
} from "@/types/resume";

/** Load a candidate-job with its candidate + job + client + resume. */
export async function loadCandidateJob(candidateJobId: string) {
  return prisma.candidateJob.findUnique({
    where: { id: candidateJobId },
    include: {
      candidate: true,
      job: { include: { client: true } },
      resume: true,
      vendor: true,
    },
  });
}

export type LoadedCandidateJob = NonNullable<
  Awaited<ReturnType<typeof loadCandidateJob>>
>;

/** Convert a stored Candidate row into a parsed CandidateProfile. */
export function toCandidateProfile(
  candidate: LoadedCandidateJob["candidate"]
): CandidateProfile {
  return {
    id: candidate.id,
    rippleHireId: candidate.rippleHireId,
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    email: candidate.email,
    phone: candidate.phone,
    currentTitle: candidate.currentTitle,
    yearsOfExperience: candidate.yearsOfExperience,
    location: candidate.location,
    skills: parseJson<string[]>(candidate.skills, []),
    summary: candidate.summary,
    experience: parseJson<ExperienceEntry[]>(candidate.experience, []),
    education: parseJson<EducationEntry[]>(candidate.education, []),
    certifications: parseJson<CertificationEntry[]>(
      candidate.certifications,
      []
    ),
    originalResumeUrl: candidate.originalResumeUrl,
  };
}
