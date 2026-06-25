"use client";

import { useState } from "react";
import { MoreVertical, FileEdit, CalendarPlus, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KEBAB_ACTIONS, type KebabAction } from "@/lib/constants";
import type { KanbanCard } from "@/types/kanban";

const LABELS: Record<KebabAction, { label: string; icon: typeof FileEdit }> = {
  edit_resume: { label: "Edit Resume", icon: FileEdit },
  schedule_interview: { label: "Schedule Interview", icon: CalendarPlus },
  reject: { label: "Reject Candidate", icon: XCircle },
};

export function CardKebabMenu({
  card,
  onReject,
}: {
  card: KanbanCard;
  onReject: (candidateJobId: string) => Promise<void> | void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const actions = KEBAB_ACTIONS[card.stage];

  if (actions.length === 0) return null;

  function handle(action: KebabAction) {
    if (action === "edit_resume") {
      window.open(
        `/vendor/resume-builder/${card.candidateJobId}`,
        "_blank",
        "noopener"
      );
    } else if (action === "schedule_interview") {
      toast("Interview scheduling is coming soon");
    } else if (action === "reject") {
      setConfirmOpen(true);
    }
  }

  async function confirmReject() {
    setRejecting(true);
    try {
      await onReject(card.candidateJobId);
      setConfirmOpen(false);
    } finally {
      setRejecting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Card actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onClick={(e) => e.stopPropagation()}
        >
          {actions.map((action) => {
            const { label, icon: Icon } = LABELS[action];
            return (
              <DropdownMenuItem
                key={action}
                onClick={() => handle(action)}
                className={action === "reject" ? "text-destructive focus:text-destructive" : ""}
              >
                <Icon className="h-4 w-4" />
                {label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Reject candidate?</DialogTitle>
            <DialogDescription>
              Move <strong>{card.name}</strong> to the Rejected column? This
              records that they were rejected at the{" "}
              <strong>{card.stage.replace(/_/g, " ").toLowerCase()}</strong>{" "}
              stage.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={rejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejecting}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
