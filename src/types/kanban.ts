import type { PipelineStage } from "@/lib/constants";

export {
  PIPELINE_COLUMNS,
  KEBAB_ACTIONS,
  VALID_TRANSITIONS,
  STAGE_LABELS,
} from "@/lib/constants";
export type { PipelineStage } from "@/lib/constants";

// Shape of a candidate card returned by the kanban candidates API.
export interface KanbanCard {
  candidateJobId: string;
  candidateId: string;
  name: string;
  title: string | null;
  jobTitle: string;
  location: string | null;
  noticePeriod: string | null;
  expectedSalary: string | null;
  yearsOfExperience: number | null;
  skills: string[];
  stage: PipelineStage;
  rejectedAtStage: PipelineStage | null;
  jobMatchScore: number | null;
  qualityScore: number | null;
  vendorName: string;
}
