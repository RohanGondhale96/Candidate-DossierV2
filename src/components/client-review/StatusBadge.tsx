import { cn } from "@/lib/utils";
import { STAGE_LABELS, type PipelineStage } from "@/lib/constants";

export function StatusBadge({
  stage,
  className,
}: {
  stage: PipelineStage;
  className?: string;
}) {
  const isRejected = stage === "REJECTED";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        isRejected
          ? "border-destructive/20 bg-destructive/10 text-destructive"
          : "border-transparent bg-secondary text-secondary-foreground",
        className
      )}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}
