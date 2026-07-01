"use client";

import { useDraggable } from "@dnd-kit/core";
import { MapPin, Briefcase, CalendarClock } from "lucide-react";

import { cn } from "@/lib/utils";
import { clarityColor } from "@/lib/candidate-ui";
import { StatusBadge } from "@/components/client-review/StatusBadge";
import type { KanbanCard } from "@/types/kanban";
import { CardKebabMenu } from "./CardKebabMenu";

function Meta({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-gray-600">
      <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
      <span className="truncate">{children}</span>
    </div>
  );
}

/** Presentational card body (also used inside the drag overlay). */
export function CandidateCardView({
  card,
  onReject,
  onShare,
  dragging,
}: {
  card: KanbanCard;
  onReject?: (id: string) => Promise<void> | void;
  onShare?: (card: KanbanCard) => void;
  dragging?: boolean;
}) {
  const top = card.skills.slice(0, 4);
  const overflow = card.skills.length - top.length;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md",
        dragging && "shadow-lg ring-1 ring-border"
      )}
    >
      {/* Header: name + title, status badge, kebab */}
      <div className="flex items-start justify-between gap-2 px-4 pt-3.5">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-semibold text-gray-900">
            {card.name}
          </div>
          {card.jobTitle && (
            <div className="truncate text-xs text-muted-foreground">
              {card.jobTitle}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <StatusBadge stage={card.stage} />
          {onReject && <CardKebabMenu card={card} onReject={onReject} onShare={onShare} />}
        </div>
      </div>

      {/* Meta: location · years · notice period · salary */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 px-4 pt-3">
        <Meta icon={MapPin}>{card.location ?? "—"}</Meta>
        <Meta icon={Briefcase}>
          {card.yearsOfExperience != null ? `${card.yearsOfExperience} yrs` : "—"}
        </Meta>
        <Meta icon={CalendarClock}>{card.noticePeriod ?? "—"}</Meta>
      </div>

      {/* Skills */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 pt-3"
           style={{ paddingBottom: card.qualityScore != null ? "0.75rem" : "1rem" }}>
        {top.map((s) => (
          <span
            key={s}
            className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-gray-600"
          >
            {s}
          </span>
        ))}
        {overflow > 0 && (
          <span
            className="cursor-default text-[11px] font-medium text-muted-foreground"
            title={card.skills.slice(top.length).join(", ")}
          >
            +{overflow} more
          </span>
        )}
      </div>

      {/* Profile clarity score */}
      {card.qualityScore != null && (
        <div className="flex items-center justify-between border-t px-4 py-2">
          <span className="text-[11px] text-muted-foreground">Profile Clarity</span>
          <span
            className="text-[11px] font-semibold"
            style={{ color: clarityColor(card.qualityScore) }}
          >
            {Math.round(card.qualityScore)}%
          </span>
        </div>
      )}
    </div>
  );
}

export function CandidateCard({
  card,
  onReject,
  onShare,
  onOpen,
}: {
  card: KanbanCard;
  onReject: (id: string) => Promise<void> | void;
  onShare?: (card: KanbanCard) => void;
  onOpen: (card: KanbanCard) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.candidateJobId,
    data: { stage: card.stage },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(card)}
      className={cn(
        "cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isDragging && "opacity-40"
      )}
    >
      <CandidateCardView card={card} onReject={onReject} onShare={onShare} />
    </div>
  );
}
