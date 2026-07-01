"use client";

import { Briefcase, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KanbanCard } from "@/types/kanban";
import { CardKebabMenu } from "./CardKebabMenu";

function ClarityBlock({ score }: { score: number }) {
  const isGood = score >= 75;
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-[#E5E7EB] px-4 py-2">
      <span
        className="text-[17px] font-semibold leading-none"
        style={{ color: isGood ? "#3B6D11" : "#854F0B" }}
      >
        {Math.round(score)}%
      </span>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.04em] text-[#9CA3AF]">
        Profile clarity
      </span>
    </div>
  );
}

export function CandidateListCard({
  card,
  selected,
  selectable,
  onSelect,
  onOpen,
  onReject,
  onShare,
}: {
  card: KanbanCard;
  selected?: boolean;
  selectable?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onOpen: (card: KanbanCard) => void;
  onReject: (id: string) => Promise<void> | void;
  onShare?: (card: KanbanCard) => void;
}) {
  return (
    <div
      role="row"
      aria-selected={selected}
      className={cn(
        "group relative flex cursor-pointer flex-col rounded bg-white px-4 py-4",
        "border border-[#E5E7EB]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
        "transition-shadow duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)]",
        selected && "border-[#BFDBFE] bg-[#EFF6FF] shadow-none hover:shadow-none"
      )}
      onClick={() => onOpen(card)}
    >
      {/* Top row: main content + right side */}
      <div className={cn("flex gap-3", card.stage === "INCOMING" ? "items-center" : "items-start")}>
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            {selectable && (
              <input
                type="checkbox"
                checked={selected ?? false}
                aria-label={`Select ${card.name}`}
                onChange={(e) => { e.stopPropagation(); onSelect?.(card.candidateJobId, e.target.checked); }}
                onClick={(e) => e.stopPropagation()}
                className="mt-[3px] h-4 w-4 shrink-0 cursor-pointer rounded accent-[#0076FB]"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold leading-[22px] text-[#2A2A2A]">
                {card.name}
              </p>
              <p className="mt-0.5 truncate text-[13px] text-[#747474]">
                {card.jobTitle}
              </p>
              <div className="mt-2 flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[13px] text-[#4B5563]">
                  <Briefcase className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
                  {card.yearsOfExperience != null ? `${card.yearsOfExperience} yrs exp` : "—"}
                </span>
                <span className="flex items-center gap-1.5 text-[13px] text-[#4B5563]">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
                  {card.noticePeriod ?? "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: clarity block + kebab */}
        <div
          className={cn("flex shrink-0 gap-3", card.stage === "INCOMING" ? "items-center" : "items-start")}
          onClick={(e) => e.stopPropagation()}
        >
          {card.qualityScore != null && (
            <ClarityBlock score={card.qualityScore} />
          )}
          <CardKebabMenu card={card} onReject={onReject} onShare={onShare} />
        </div>
      </div>

      {/* Recruiter note — full-width divider + note */}
      {card.stage !== "INCOMING" && card.recruiterNotes && (
        <p className="mt-2 line-clamp-2 border-t border-[#F3F4F6] pt-2 text-[12px] leading-relaxed text-[#9CA3AF]">
          {card.recruiterNotes}
        </p>
      )}
    </div>
  );
}
