export interface PipelineCounts {
  INCOMING: number;
  PRESENTED: number;
  ACCEPTED: number;
  NOT_A_FIT: number;
}

export interface JobSummary {
  id: string;
  title: string;
  clientName: string;
  location: string | null;
  openPositions: number;
  status: "ACTIVE" | "PAUSED";
  pipeline: PipelineCounts;
}

export interface JobDetail extends JobSummary {
  description: string;
  requirements: string;
  requiredSkills: string[];
  salaryRange: string | null;
}
