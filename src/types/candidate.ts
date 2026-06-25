import type {
  ExperienceEntry,
  EducationEntry,
  CertificationEntry,
} from "./resume";

// Structured candidate data as it comes from "RippleHire" (after JSON parsing
// of the string columns stored in SQLite).
export interface CandidateProfile {
  id: string;
  rippleHireId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  currentTitle: string | null;
  yearsOfExperience: number | null;
  location: string | null;
  skills: string[];
  summary: string | null;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: CertificationEntry[];
  originalResumeUrl: string | null;
}
