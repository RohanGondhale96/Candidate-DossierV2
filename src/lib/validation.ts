import { z } from "zod";

// Loose-but-structured validation for resume content coming from the editor.
const sectionTypeSchema = z.enum([
  "header",
  "recruiter_note",
  "summary",
  "skills",
  "experience",
  "education",
  "certifications",
  "custom",
]);

const sectionSchema = z.object({
  id: z.string(),
  type: sectionTypeSchema,
  order: z.number(),
  visible: z.boolean(),
  data: z.record(z.string(), z.unknown()),
});

export const resumeContentSchema = z.object({
  sections: z.array(sectionSchema),
});

export const saveResumeSchema = z.object({
  content: resumeContentSchema,
  templateId: z.string().min(1),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{6})$/, "Invalid hex color"),
  fontFamily: z.string().optional(),
  logoUrl: z.string().nullable().optional(),
  logoHidden: z.boolean().optional(),
  jobMatchScore: z.number().min(0).max(100).nullable().optional(),
  qualityScore: z.number().min(0).max(100).nullable().optional(),
  recruiterNotes: z.string().nullable().optional(),
  changeNote: z.string().optional(),
});

export type SaveResumeInput = z.infer<typeof saveResumeSchema>;
