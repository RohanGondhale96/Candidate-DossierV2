"use client";

import { Briefcase, MapPin, DollarSign, Users } from "lucide-react";

import { useResumeStore } from "@/stores/resumeStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface JobDescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MetaItem({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-gray-400" />
      {children}
    </span>
  );
}

export function JobDescriptionDialog({
  open,
  onOpenChange,
}: JobDescriptionDialogProps) {
  const jobTitle = useResumeStore((s) => s.jobTitle);
  const clientName = useResumeStore((s) => s.clientName);
  const jobLocation = useResumeStore((s) => s.jobLocation);
  const jobSalaryRange = useResumeStore((s) => s.jobSalaryRange);
  const jobOpenPositions = useResumeStore((s) => s.jobOpenPositions);
  const jobRequirements = useResumeStore((s) => s.jobRequirements);
  const jobRequiredSkills = useResumeStore((s) => s.jobRequiredSkills);
  const jobDescription = useResumeStore((s) => s.jobDescription);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {jobTitle || "Job description"}
          </DialogTitle>
          <DialogDescription>{clientName}</DialogDescription>
        </DialogHeader>

        {/* Meta line: location · salary · openings */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {jobLocation && <MetaItem icon={MapPin}>{jobLocation}</MetaItem>}
          {jobSalaryRange && (
            <MetaItem icon={DollarSign}>{jobSalaryRange}</MetaItem>
          )}
          <MetaItem icon={Users}>
            {jobOpenPositions}{" "}
            {jobOpenPositions === 1 ? "open position" : "open positions"}
          </MetaItem>
        </div>

        {/* Description */}
        {jobDescription && (
          <section>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Description
            </h4>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {jobDescription}
            </p>
          </section>
        )}

        {/* Requirements */}
        {jobRequirements && (
          <section>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Requirements
            </h4>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {jobRequirements}
            </p>
          </section>
        )}

        {/* Required skills */}
        {jobRequiredSkills.length > 0 && (
          <section>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Required skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {jobRequiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
