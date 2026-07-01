"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  PIPELINE_COLUMNS,
  VALID_TRANSITIONS,
  type PipelineStage,
} from "@/lib/constants";
import type { KanbanCard } from "@/types/kanban";
import { KanbanColumn } from "./KanbanColumn";
import { CandidateCardView } from "./CandidateCard";

export function KanbanBoard({
  cards,
  onStageChange,
  onReject,
  onShare,
  onOpen,
}: {
  cards: KanbanCard[];
  onStageChange: (id: string, newStage: PipelineStage) => void;
  onReject: (id: string) => Promise<void> | void;
  onShare?: (card: KanbanCard) => void;
  onOpen: (card: KanbanCard) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const activeCard = cards.find((c) => c.candidateJobId === activeId) ?? null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const card = cards.find((c) => c.candidateJobId === String(active.id));
    const target = String(over.id) as PipelineStage;
    if (!card || card.stage === target) return;
    if (VALID_TRANSITIONS[card.stage].includes(target)) {
      onStageChange(card.candidateJobId, target);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex h-full gap-4 overflow-x-auto px-6 pb-4 pt-4">
        {PIPELINE_COLUMNS.map((col) => (
          <KanbanColumn
            key={col.stage}
            stage={col.stage}
            label={col.label}
            cards={cards.filter((c) => c.stage === col.stage)}
            dragging={!!activeCard}
            isValidTarget={
              !!activeCard &&
              VALID_TRANSITIONS[activeCard.stage].includes(col.stage)
            }
            onReject={onReject}
            onShare={onShare}
            onOpen={onOpen}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? (
          <div className="w-[360px]">
            <CandidateCardView card={activeCard} dragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
