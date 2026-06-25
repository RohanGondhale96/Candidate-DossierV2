export interface JobSummary {
  id: string;
  title: string;
  clientName: string;
  location: string | null;
  openPositions: number;
}

export interface JobDetail extends JobSummary {
  description: string;
  requirements: string;
  requiredSkills: string[];
  salaryRange: string | null;
}
