// Shared domain constants. SQLite has no native enums, so these string-union
// types + constant maps are the single source of truth for roles and pipeline
// stages across the app (validation, UI, transitions).

export type UserRole = "VENDOR" | "CLIENT";

export type PipelineStage =
  | "INCOMING"
  | "PRESENTED"
  | "ACCEPTED"
  | "NOT_A_FIT";

export const PIPELINE_STAGES: PipelineStage[] = [
  "INCOMING",
  "PRESENTED",
  "ACCEPTED",
  "NOT_A_FIT",
];

export const STAGE_LABELS: Record<PipelineStage, string> = {
  INCOMING: "Incoming Profiles",
  PRESENTED: "In Review",
  ACCEPTED: "Accepted by Client",
  NOT_A_FIT: "Not a Fit",
};

export const STAGE_SHORT_LABELS: Record<PipelineStage, string> = {
  INCOMING: "Incoming",
  PRESENTED: "In Review",
  ACCEPTED: "Accepted",
  NOT_A_FIT: "Not a Fit",
};

export const PIPELINE_COLUMNS: { stage: PipelineStage; label: string }[] =
  PIPELINE_STAGES.map((stage) => ({ stage, label: STAGE_LABELS[stage] }));

export type KebabAction = "edit_resume" | "not_a_fit" | "share_with_client";

export const KEBAB_ACTIONS: Record<PipelineStage, KebabAction[]> = {
  INCOMING: ["share_with_client", "edit_resume", "not_a_fit"],
  PRESENTED: ["edit_resume", "not_a_fit"],
  ACCEPTED: ["edit_resume"],
  NOT_A_FIT: [],
};

// All stages can move to any other stage — fully reversible drag.
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
