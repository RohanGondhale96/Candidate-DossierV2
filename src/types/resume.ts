export type ResumeSectionType =
  | "header"
  | "recruiter_note"
  | "summary"
  | "skills"
  | "experience"
  | "education"
  | "certifications"
  | "custom";

export interface HeaderData {
  candidateName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
}

export interface RecruiterNoteData {
  content: string;
}

export interface SummaryData {
  content: string;
}

export interface SkillItem {
  id: string;
  name: string;
  category?: string;
  /** "Assessed" proficiency, 0–5 in 0.5 steps. */
  rating?: number;
}

export interface SkillsData {
  skills: SkillItem[];
}

export interface ExperienceEntry {
  id: string;
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string | null;
  description: string;
}

export interface ExperienceData {
  entries: ExperienceEntry[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface EducationData {
  entries: EducationEntry[];
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  dateObtained?: string;
  expiryDate?: string;
}

export interface CertificationsData {
  entries: CertificationEntry[];
}

export interface CustomSectionData {
  title: string;
  content: string;
}

export type SectionData =
  | HeaderData
  | RecruiterNoteData
  | SummaryData
  | SkillsData
  | ExperienceData
  | EducationData
  | CertificationsData
  | CustomSectionData;

export interface ResumeSection {
  id: string;
  type: ResumeSectionType;
  order: number;
  visible: boolean;
  data: SectionData;
}

export interface ResumeContent {
  sections: ResumeSection[];
}

export interface TemplateMeta {
  id: string;
  name: string;
  description: string;
}

export const AVAILABLE_TEMPLATES: TemplateMeta[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Single column, clean and straightforward",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Two-column layout with sidebar",
  },
  {
    id: "compact",
    name: "Compact",
    description: "Dense, information-packed",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Lots of whitespace, elegant",
  },
];

export const ACCENT_COLORS = [
  "#6B4FBB", // Purple (default)
  "#1D9E75", // Teal
  "#D85A30", // Coral
  "#378ADD", // Blue
  "#2C2C2A", // Dark
  "#993556", // Pink
] as const;

export const DEFAULT_ACCENT = "#6B4FBB";
export const DEFAULT_TEMPLATE = "classic";

export interface FontOption {
  id: string;
  label: string;
  stack: string;
}

// Font choices a vendor can apply to the whole resume. The empty-string id
// ("") means "use the template's built-in default font".
export const FONT_OPTIONS: FontOption[] = [
  // System fonts (no download required)
  { id: "system", label: "System UI", stack: "system-ui, 'Segoe UI', Roboto, sans-serif" },
  { id: "georgia", label: "Georgia", stack: "Georgia, 'Times New Roman', serif" },
  { id: "times", label: "Times New Roman", stack: "'Times New Roman', Times, serif" },
  { id: "verdana", label: "Verdana", stack: "Verdana, Geneva, sans-serif" },
  { id: "palatino", label: "Palatino", stack: "'Palatino Linotype', 'Book Antiqua', serif" },
  { id: "arial", label: "Arial", stack: "Arial, Helvetica, sans-serif" },
  // Self-hosted web fonts (via @fontsource)
  { id: "inter", label: "Inter", stack: "'Inter', sans-serif" },
  { id: "roboto", label: "Roboto", stack: "'Roboto', sans-serif" },
  { id: "poppins", label: "Poppins", stack: "'Poppins', sans-serif" },
  { id: "opensans", label: "Open Sans", stack: "'Open Sans', sans-serif" },
];

export const DEFAULT_FONT = "";

// Resolve a font id to its CSS font-family stack. Returns undefined for the
// empty-string id so callers can leave the style unset (template default).
export function fontStack(id: string): string | undefined {
  if (!id) return undefined;
  return FONT_OPTIONS.find((f) => f.id === id)?.stack;
}

export const SECTION_TITLES: Record<ResumeSectionType, string> = {
  header: "Header",
  recruiter_note: "Recruiter Note",
  summary: "Summary",
  skills: "Assessed Skills",
  experience: "Experience",
  education: "Education",
  certifications: "Certifications",
  custom: "Custom Section",
};
