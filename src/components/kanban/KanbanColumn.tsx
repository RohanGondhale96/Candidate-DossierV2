"use client";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";
import { STAGE_SHORT_LABELS } from "@/lib/constants";
import type { KanbanCard, PipelineStage } from "@/types/kanban";
import { CandidateCard } from "./CandidateCard";

export function KanbanColumn({
  stage,
  cards,
  dragging,
  isValidTarget,
  onReject,
  onShare,
  onOpen,
}: {
  stage: PipelineStage;
  label: string;
  cards: KanbanCard[];
  dragging: boolean;
  isValidTarget: boolean;
  onReject: (id: string) => Promise<void> | void;
  onShare?: (card: KanbanCard) => void;
  onOpen: (card: KanbanCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex w-[360px] shrink-0 flex-col">
      {/* Column header — neutral label + count */}
      <div className="mb-3 flex items-center gap-2 px-0.5">
        <h3 className="text-sm font-medium text-foreground">
          {STAGE_SHORT_LABELS[stage]}
        </h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {cards.length}
        </span>
      </div>

      {/* Droppable list */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[140px] flex-1 flex-col gap-2.5 rounded-lg p-1 transition-colors",
          dragging && isValidTarget && "bg-muted/60",
          dragging && isValidTarget && isOver && "bg-muted ring-2 ring-primary/30",
          dragging && !isValidTarget && "opacity-40"
        )}
      >
        {cards.map((card) => (
          <CandidateCard
            key={card.candidateJobId}
            card={card}
            onReject={onReject}
            onShare={onShare}
            onOpen={onOpen}
          />
        ))}
        {cards.length === 0 && !dragging && (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-10 text-center text-xs text-muted-foreground/60">
            No candidates
          </div>
        )}
      </div>
    </div>
  );
}
