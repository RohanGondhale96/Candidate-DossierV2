"use client";

import { useMemo } from "react";
import { ChevronDown } from "lucide-react";

import { useResumeStore } from "@/stores/resumeStore";
import { computeScores, type ScoreFactor } from "@/lib/scoring";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function scoreColor(value: number): string {
  if (value >= 75) return "#1D9E75"; // green
  if (value >= 50) return "#D9A21B"; // amber
  return "#D85A30"; // coral
}

function Breakdown({ factors }: { factors: ScoreFactor[] }) {
  return (
    <div className="space-y-2">
      {factors
        .filter((f) => f.max > 0)
        .map((f) => {
          const pct = f.max ? (f.points / f.max) * 100 : 0;
          return (
            <div key={f.label}>
              <div className="mb-0.5 flex items-baseline justify-between text-xs">
                <span className="text-gray-600">{f.label}</span>
                <span className="tabular-nums text-gray-400">
                  {f.points}/{f.max}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: scoreColor(pct) }}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}

export function ScoreDisplay({ compact = false }: { compact?: boolean }) {
  const content = useResumeStore((s) => s.content);
  const requiredSkills = useResumeStore((s) => s.jobRequiredSkills);
  const requirements = useResumeStore((s) => s.jobRequirements);

  const result = useMemo(
    () => computeScores(content, requiredSkills, requirements),
    [content, requiredSkills, requirements]
  );

  const rows = [
    {
      label: "Profile clarity",
      value: result.qualityScore,
      factors: result.qualityBreakdown,
      hint: "Overall completeness and clarity of the candidate's profile.",
    },
  ];

  return (
    <div className={compact ? "flex gap-4" : "space-y-3"}>
      {rows.map((s) => (
        <Popover key={s.label}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="group block w-full rounded text-left"
              title="Click for breakdown"
            >
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-1 text-xs font-medium text-gray-600">
                  {s.label}
                  <ChevronDown className="h-3 w-3 text-gray-300 transition-colors group-hover:text-gray-500" />
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {s.value}
                  <span className="text-xs font-normal text-gray-400">%</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${s.value}%`,
                    backgroundColor: scoreColor(s.value),
                  }}
                />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" className="w-64">
            <div className="mb-2">
              <div className="text-sm font-semibold">{s.label}</div>
              <p className="text-[11px] leading-tight text-gray-500">{s.hint}</p>
            </div>
            <Breakdown factors={s.factors} />
          </PopoverContent>
        </Popover>
      ))}
      {!compact && (
        <p className="text-[10px] leading-tight text-gray-400">
          Updates live as you edit. Click a score for the breakdown.
        </p>
      )}
    </div>
  );
}
