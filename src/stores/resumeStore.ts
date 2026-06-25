import { create } from "zustand";
import { toast } from "sonner";

import type {
  ResumeContent,
  ResumeSection,
  ResumeSectionType,
  SectionData,
  RecruiterNoteData,
} from "@/types/resume";
import { DEFAULT_ACCENT, DEFAULT_TEMPLATE, DEFAULT_FONT } from "@/types/resume";
import { createEmptySection } from "@/lib/resume-content";
import { computeScores } from "@/lib/scoring";
import type { PipelineStage } from "@/lib/constants";

export interface ResumeServerData {
  candidateJobId: string;
  candidateName: string;
  jobTitle: string;
  clientName: string;
  stage: PipelineStage;
  recruiterNotes: string | null;
  hasExistingResume: boolean;
  job: {
    description: string;
    requirements: string;
    requiredSkills: string[];
    location: string | null;
    salaryRange: string | null;
    openPositions: number;
  };
  resume: {
    templateId: string;
    accentColor: string;
    fontFamily: string;
    logoUrl: string | null;
    logoHidden: boolean;
    content: ResumeContent;
    jobMatchScore: number | null;
    qualityScore: number | null;
  };
}

interface ResumeStore {
  // Identity / meta
  candidateJobId: string | null;
  candidateName: string;
  jobTitle: string;
  clientName: string;
  stage: PipelineStage | null;

  // Resume data
  content: ResumeContent;
  templateId: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string | null;
  logoHidden: boolean;

  // Job context (for live scoring)
  jobRequiredSkills: string[];
  jobRequirements: string;

  // Job context (read-only, for the job description popup)
  jobDescription: string;
  jobLocation: string | null;
  jobSalaryRange: string | null;
  jobOpenPositions: number;

  // Scores persisted on save (computed live by src/lib/scoring.ts)
  jobMatchScore: number | null;
  qualityScore: number | null;

  // Editor state
  initialized: boolean;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveTick: number; // increments on each successful save (version refresh signal)

  // Actions
  initFromServer: (data: ResumeServerData) => void;
  updateSectionData: (sectionId: string, partial: Partial<SectionData>) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  addSection: (type: ResumeSectionType) => void;
  removeSection: (sectionId: string) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  setTemplate: (templateId: string) => void;
  setAccentColor: (color: string) => void;
  setFontFamily: (id: string) => void;
  setLogo: (url: string | null) => void;
  setLogoHidden: (hidden: boolean) => void;
  setStage: (stage: PipelineStage) => void;
  applyRestored: (resume: ResumeServerData["resume"]) => void;
  saveResume: (changeNote?: string) => Promise<boolean>;
}

const reindex = (sections: ResumeSection[]): ResumeSection[] =>
  sections.map((s, i) => ({ ...s, order: i }));

function deriveRecruiterNotes(content: ResumeContent): string | null {
  const section = content.sections.find((s) => s.type === "recruiter_note");
  if (!section) return null;
  return (section.data as RecruiterNoteData).content ?? null;
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  candidateJobId: null,
  candidateName: "",
  jobTitle: "",
  clientName: "",
  stage: null,

  content: { sections: [] },
  templateId: DEFAULT_TEMPLATE,
  accentColor: DEFAULT_ACCENT,
  fontFamily: DEFAULT_FONT,
  logoUrl: null,
  logoHidden: false,

  jobRequiredSkills: [],
  jobRequirements: "",

  jobDescription: "",
  jobLocation: null,
  jobSalaryRange: null,
  jobOpenPositions: 0,

  jobMatchScore: null,
  qualityScore: null,

  initialized: false,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  saveTick: 0,

  initFromServer: (data) =>
    set({
      candidateJobId: data.candidateJobId,
      candidateName: data.candidateName,
      jobTitle: data.jobTitle,
      clientName: data.clientName,
      stage: data.stage,
      content: { sections: reindex(data.resume.content.sections) },
      templateId: data.resume.templateId,
      accentColor: data.resume.accentColor,
      fontFamily: data.resume.fontFamily || DEFAULT_FONT,
      logoUrl: data.resume.logoUrl,
      logoHidden: data.resume.logoHidden,
      jobRequiredSkills: data.job.requiredSkills,
      jobRequirements: data.job.requirements,
      jobDescription: data.job.description ?? "",
      jobLocation: data.job.location ?? null,
      jobSalaryRange: data.job.salaryRange ?? null,
      jobOpenPositions: data.job.openPositions ?? 0,
      jobMatchScore: data.resume.jobMatchScore,
      qualityScore: data.resume.qualityScore,
      initialized: true,
      isDirty: false,
      lastSavedAt: data.hasExistingResume ? new Date() : null,
    }),

  updateSectionData: (sectionId, partial) =>
    set((state) => ({
      isDirty: true,
      content: {
        sections: state.content.sections.map((s) =>
          s.id === sectionId
            ? ({ ...s, data: { ...s.data, ...partial } } as ResumeSection)
            : s
        ),
      },
    })),

  reorderSections: (fromIndex, toIndex) =>
    set((state) => {
      const sections = [...state.content.sections];
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= sections.length ||
        toIndex >= sections.length
      ) {
        return state;
      }
      const [moved] = sections.splice(fromIndex, 1);
      sections.splice(toIndex, 0, moved);
      return { isDirty: true, content: { sections: reindex(sections) } };
    }),

  addSection: (type) =>
    set((state) => {
      const sections = [...state.content.sections];
      sections.push(createEmptySection(type, sections.length));
      return { isDirty: true, content: { sections: reindex(sections) } };
    }),

  removeSection: (sectionId) =>
    set((state) => {
      const target = state.content.sections.find((s) => s.id === sectionId);
      if (target?.type === "header") return state; // header is permanent
      return {
        isDirty: true,
        content: {
          sections: reindex(
            state.content.sections.filter((s) => s.id !== sectionId)
          ),
        },
      };
    }),

  toggleSectionVisibility: (sectionId) =>
    set((state) => ({
      isDirty: true,
      content: {
        sections: state.content.sections.map((s) =>
          s.id === sectionId ? { ...s, visible: !s.visible } : s
        ),
      },
    })),

  setTemplate: (templateId) => set({ templateId, isDirty: true }),
  setAccentColor: (accentColor) => set({ accentColor, isDirty: true }),
  setFontFamily: (fontFamily) => set({ fontFamily, isDirty: true }),
  // Setting a logo image also un-hides the logo area.
  setLogo: (logoUrl) => set({ logoUrl, logoHidden: false, isDirty: true }),
  setLogoHidden: (logoHidden) => set({ logoHidden, isDirty: true }),
  setStage: (stage) => set({ stage }),

  applyRestored: (resume) =>
    set({
      content: { sections: reindex(resume.content.sections) },
      templateId: resume.templateId,
      accentColor: resume.accentColor,
      fontFamily: resume.fontFamily || DEFAULT_FONT,
      logoUrl: resume.logoUrl,
      logoHidden: resume.logoHidden,
      jobMatchScore: resume.jobMatchScore,
      qualityScore: resume.qualityScore,
      isDirty: false,
      lastSavedAt: new Date(),
    }),

  saveResume: async (changeNote) => {
    const state = get();
    if (!state.candidateJobId || state.isSaving) return false;

    set({ isSaving: true });
    // Recompute live scores so the persisted values match what the vendor sees.
    const scores = computeScores(
      state.content,
      state.jobRequiredSkills,
      state.jobRequirements
    );
    try {
      const res = await fetch(
        `/api/candidate-jobs/${state.candidateJobId}/resume`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: state.content,
            templateId: state.templateId,
            accentColor: state.accentColor,
            fontFamily: state.fontFamily,
            logoUrl: state.logoUrl,
            logoHidden: state.logoHidden,
            jobMatchScore: scores.jobMatchScore,
            qualityScore: scores.qualityScore,
            recruiterNotes: deriveRecruiterNotes(state.content),
            changeNote,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Save failed");
      }

      set((s) => ({
        isSaving: false,
        isDirty: false,
        lastSavedAt: new Date(),
        saveTick: s.saveTick + 1,
      }));
      return true;
    } catch (e) {
      set({ isSaving: false });
      toast.error(e instanceof Error ? e.message : "Failed to save resume");
      return false;
    }
  },
}));
