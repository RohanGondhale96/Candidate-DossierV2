"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { JobSummary } from "@/types/job";

export function JobFilter({
  jobs,
  value,
  onChange,
}: {
  jobs: JobSummary[];
  value: string | null;
  onChange: (jobId: string) => void;
}) {
  return (
    <Select value={value ?? undefined} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-[320px] bg-white">
        <SelectValue placeholder="Select a role…" />
      </SelectTrigger>
      <SelectContent>
        {jobs.map((job) => (
          <SelectItem key={job.id} value={job.id}>
            {job.clientName} — {job.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
