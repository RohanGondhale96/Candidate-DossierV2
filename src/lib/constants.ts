// Shared domain constants. SQLite has no native enums, so these string-union
// types + constant maps are the single source of truth for roles and pipeline
// stages across the app (validation, UI, transitions).

export type UserRole = "VENDOR" | "CLIENT";

export type PipelineStage =
  | "SHORTLISTED"
  | "IN_REVIEW"
  | "REVIEW_ACCEPTED"
  | "SCHEDULED_INTERVIEW"
  | "PENDING_FEEDBACK"
  | "ACCEPTED"
  | "REJECTED";

export const PIPELINE_STAGES: PipelineStage[] = [
  "SHORTLISTED",
  "IN_REVIEW",
  "REVIEW_ACCEPTED",
  "SCHEDULED_INTERVIEW",
  "PENDING_FEEDBACK",
  "ACCEPTED",
  "REJECTED",
];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  SHORTLISTED: "Shortlisted",
  IN_REVIEW: "In Review",
  REVIEW_ACCEPTED: "Review Accepted",
  SCHEDULED_INTERVIEW: "Scheduled Interview",
  PENDING_FEEDBACK: "Pending Feedback",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

// Compact column headings for the board (kept identical to STAGE_LABELS here).
export const STAGE_SHORT_LABELS: Record<PipelineStage, string> = {
  SHORTLISTED: "Shortlisted",
  IN_REVIEW: "In Review",
  REVIEW_ACCEPTED: "Review Accepted",
  SCHEDULED_INTERVIEW: "Scheduled Interview",
  PENDING_FEEDBACK: "Pending Feedback",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export const PIPELINE_COLUMNS: { stage: PipelineStage; label: string }[] =
  PIPELINE_STAGES.map((stage) => ({ stage, label: STAGE_LABELS[stage] }));

export type KebabAction = "edit_resume" | "schedule_interview" | "reject";

export const KEBAB_ACTIONS: Record<PipelineStage, KebabAction[]> = {
  SHORTLISTED: ["edit_resume", "schedule_interview", "reject"],
  IN_REVIEW: ["edit_resume", "schedule_interview", "reject"],
  REVIEW_ACCEPTED: ["edit_resume", "schedule_interview", "reject"],
  SCHEDULED_INTERVIEW: ["edit_resume", "schedule_interview", "reject"],
  PENDING_FEEDBACK: ["edit_resume", "reject"],
  ACCEPTED: ["edit_resume", "reject"],
  REJECTED: [],
};

// Transitions are intentionally unrestricted: a vendor can drag a candidate to
// ANY other stage (including back to a previous one, or out of Rejected) so an
// accidental move is always reversible. Each stage maps to every other stage.
export const VALID_TRANSITIONS: Record<PipelineStage, PipelineStage[]> =
  Object.fromEntries(
    PIPELINE_STAGES.map((stage) => [
      stage,
      PIPELINE_STAGES.filter((target) => target !== stage),
    ])
  ) as Record<PipelineStage, PipelineStage[]>;

export function isValidStage(value: string): value is PipelineStage {
  return (PIPELINE_STAGES as string[]).includes(value);
}
