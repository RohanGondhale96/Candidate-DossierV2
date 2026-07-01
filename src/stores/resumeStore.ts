import { create } from "zustand";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

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
  candidateSummary: string | null;
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

type ResumeSnapshot = {
  content: ResumeContent;
  templateId: string;
  accentColor: string;
  fontFamily: string;
  logoUrl: string | null;
  logoHidden: boolean;
};

const MAX_HISTORY = 50;

function snap(s: ResumeSnapshot): ResumeSnapshot {
  return {
    content: s.content,
    templateId: s.templateId,
    accentColor: s.accentColor,
    fontFamily: s.fontFamily,
    logoUrl: s.logoUrl,
    logoHidden: s.logoHidden,
  };
}

// Spread into any set() call to push current state onto the undo stack.
function push(s: ResumeSnapshot & { past: ResumeSnapshot[]; future: ResumeSnapshot[] }) {
  return {
    past: [...s.past.slice(-(MAX_HISTORY - 1)), snap(s)],
    future: [] as ResumeSnapshot[],
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
  saveTick: number;

  // Undo / redo history
  past: ResumeSnapshot[];
  future: ResumeSnapshot[];

  // Actions
  initFromServer: (data: ResumeServerData) => void;
  updateSectionData: (sectionId: string, partial: Partial<SectionData>) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  addSection: (type: ResumeSectionType) => void;
  addSectionWithData: (type: ResumeSectionType, data: SectionData) => void;
  removeSection: (sectionId: string) => void;
  toggleSectionVisibility: (sectionId: string) => void;
  setTemplate: (templateId: string) => void;
  setAccentColor: (color: string) => void;
  setFontFamily: (id: string) => void;
  setLogo: (url: string | null) => void;
  setLogoHidden: (hidden: boolean) => void;
  setStage: (stage: PipelineStage) => void;
  applyRestored: (resume: ResumeServerData["resume"]) => void;
  undo: () => void;
  redo: () => void;
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

  past: [],
  future: [],

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
      past: [],
      future: [],
    }),

  updateSectionData: (sectionId, partial) =>
    set((state) => ({
      ...push(state),
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
      return { ...push(state), isDirty: true, content: { sections: reindex(sections) } };
    }),

  addSection: (type) =>
    set((state) => {
      const sections = [...state.content.sections];
      sections.push(createEmptySection(type, sections.length));
      return { ...push(state), isDirty: true, content: { sections: reindex(sections) } };
    }),

  addSectionWithData: (type, data) =>
    set((state) => {
      const sections = [...state.content.sections];
      sections.push({ id: uuidv4(), type, order: sections.length, visible: true, data });
      return { ...push(state), isDirty: true, content: { sections: reindex(sections) } };
    }),

  removeSection: (sectionId) =>
    set((state) => {
      const target = state.content.sections.find((s) => s.id === sectionId);
      if (target?.type === "header") return state;
      return {
        ...push(state),
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
      ...push(state),
      isDirty: true,
      content: {
        sections: state.content.sections.map((s) =>
          s.id === sectionId ? { ...s, visible: !s.visible } : s
        ),
      },
    })),

  setTemplate: (templateId) =>
    set((state) => ({ ...push(state), templateId, isDirty: true })),

  setAccentColor: (accentColor) =>
    set((state) => ({ ...push(state), accentColor, isDirty: true })),

  setFontFamily: (fontFamily) =>
    set((state) => ({ ...push(state), fontFamily, isDirty: true })),

  setLogo: (logoUrl) =>
    set((state) => ({ ...push(state), logoUrl, logoHidden: false, isDirty: true })),

  setLogoHidden: (logoHidden) =>
    set((state) => ({ ...push(state), logoHidden, isDirty: true })),

  setStage: (stage) => set({ stage }),

  // Restoring a version is itself undoable — push current state first.
  applyRestored: (resume) =>
    set((state) => ({
      ...push(state),
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
    })),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        ...previous,
        past: state.past.slice(0, -1),
        future: [snap(state), ...state.future].slice(0, MAX_HISTORY),
        isDirty: true,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        ...next,
        past: [...state.past, snap(state)].slice(-MAX_HISTORY),
        future: state.future.slice(1),
        isDirty: true,
      };
    }),

  saveResume: async (changeNote) => {
    const state = get();
    if (!state.candidateJobId || state.isSaving) return false;

    set({ isSaving: true });
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
