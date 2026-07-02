import { v4 as uuidv4 } from "uuid";
import type { CandidateProfile } from "../types/candidate";
import type {
  ResumeContent,
  ResumeSection,
  ResumeSectionType,
  SectionData,
} from "../types/resume";

// Deterministic "assessed" proficiency (3.5, 4.0, or 4.5) derived from the
// skill name, so the rating is stable across rebuilds rather than random.
export function skillRating(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return 3.5 + (h % 3) * 0.5; // 3.5, 4.0, or 4.5
}

/**
 * Build the initial ResumeContent for a candidate from their structured data.
 * Used by the seed (to pre-populate ResumeData) and by the resume API the first
 * time a vendor opens the builder for a candidate-job with no resume yet.
 */
export function buildInitialResumeContent(
  candidate: CandidateProfile,
  recruiterNotes?: string | null
): ResumeContent {
  const sections: ResumeSection[] = [];
  let order = 0;

  sections.push({
    id: uuidv4(),
    type: "header",
    order: order++,
    visible: true,
    data: {
      candidateName: `${candidate.firstName} ${candidate.lastName}`.trim(),
      title: candidate.currentTitle ?? "",
      email: candidate.email,
      phone: candidate.phone ?? "",
      location: candidate.location ?? "",
    },
  });

  sections.push({
    id: uuidv4(),
    type: "recruiter_note",
    order: order++,
    visible: true,
    data: { content: recruiterNotes ?? "" },
  });

  sections.push({
    id: uuidv4(),
    type: "summary",
    order: order++,
    visible: true,
    data: { content: candidate.summary ?? "" },
  });

  sections.push({
    id: uuidv4(),
    type: "skills",
    order: order++,
    visible: true,
    data: {
      skills: candidate.skills
        .map((name) => ({ id: uuidv4(), name, rating: skillRating(name) }))
        .sort((a, b) => b.rating - a.rating),
    },
  });

  sections.push({
    id: uuidv4(),
    type: "experience",
    order: order++,
    visible: true,
    data: {
      entries: candidate.experience.map((e) => ({
        id: e.id || uuidv4(),
        company: e.company,
        title: e.title,
        location: e.location,
        startDate: e.startDate,
        endDate: e.endDate ?? null,
        description: e.description,
      })),
    },
  });

  sections.push({
    id: uuidv4(),
    type: "education",
    order: order++,
    visible: true,
    data: {
      entries: candidate.education.map((e) => ({
        id: e.id || uuidv4(),
        institution: e.institution,
        degree: e.degree,
        field: e.field,
        startDate: e.startDate,
        endDate: e.endDate,
        description: e.description,
      })),
    },
  });

  if (candidate.certifications && candidate.certifications.length > 0) {
    sections.push({
      id: uuidv4(),
      type: "certifications",
      order: order++,
      visible: true,
      data: {
        entries: candidate.certifications.map((c) => ({
          id: c.id || uuidv4(),
          name: c.name,
          issuer: c.issuer,
          dateObtained: c.dateObtained,
          expiryDate: c.expiryDate,
        })),
      },
    });
  }

  return { sections };
}

/** Create a new empty section of the given type (used by "Add Section"). */
export function createEmptySection(
  type: ResumeSectionType,
  order: number
): ResumeSection {
  let data: SectionData;
  switch (type) {
    case "summary":
      data = { content: "" };
      break;
    case "recruiter_note":
      data = { content: "" };
      break;
    case "skills":
      data = { skills: [] };
      break;
    case "experience":
      data = { entries: [] };
      break;
    case "education":
      data = { entries: [] };
      break;
    case "certifications":
      data = { entries: [] };
      break;
    case "custom":
      data = { title: "New Section", content: "" };
      break;
    case "header":
    default:
      data = {
        candidateName: "",
        title: "",
        email: "",
        phone: "",
        location: "",
      };
      break;
  }
  return { id: uuidv4(), type, order, visible: true, data };
}
