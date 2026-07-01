"use client";

import { useState } from "react";
import { MoreVertical, FileEdit, XCircle, Send } from "lucide-react";

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
  share_with_client: { label: "Share with Client", icon: Send },
  edit_resume: { label: "Edit Profile", icon: FileEdit },
  not_a_fit: { label: "Not a Fit", icon: XCircle },
};

export function CardKebabMenu({
  card,
  onReject,
  onShare,
}: {
  card: KanbanCard;
  onReject: (candidateJobId: string) => Promise<void> | void;
  onShare?: (card: KanbanCard) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const actions = KEBAB_ACTIONS[card.stage];

  if (actions.length === 0) return null;

  function handle(action: KebabAction) {
    if (action === "share_with_client") {
      onShare?.(card);
    } else if (action === "edit_resume") {
      window.open(
        `/vendor/resume-builder/${card.candidateJobId}`,
        "_blank",
        "noopener"
      );
    } else if (action === "not_a_fit") {
      setConfirmOpen(true);
    }
  }

  async function confirm() {
    setSubmitting(true);
    try {
      await onReject(card.candidateJobId);
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
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
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {actions.map((action) => {
            const { label, icon: Icon } = LABELS[action];
            return (
              <DropdownMenuItem
                key={action}
                onClick={() => handle(action)}
                className={
                  action === "not_a_fit"
                    ? "text-destructive focus:text-destructive"
                    : ""
                }
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
            <DialogTitle>Mark as not a fit?</DialogTitle>
            <DialogDescription>
              Move <strong>{card.name}</strong> to Not a Fit? You can drag them
              back to any column if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirm}
              disabled={submitting}
            >
              Not a Fit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
