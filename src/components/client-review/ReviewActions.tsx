"use client";

import { useState } from "react";
import { CalendarPlus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PipelineStage } from "@/lib/constants";

export function ReviewActions({
  candidateJobId,
  candidateName,
  stage,
  onChanged,
}: {
  candidateJobId: string;
  candidateName: string;
  stage: PipelineStage;
  onChanged: (stage: PipelineStage) => void;
}) {
  const [busy, setBusy] = useState<PipelineStage | null>(null);
  const [confirmReject, setConfirmReject] = useState(false);

  async function move(next: PipelineStage, message: string) {
    setBusy(next);
    try {
      const res = await fetch(`/api/candidate-jobs/${candidateJobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Action failed");
      }
      onChanged(next);
      toast.success(message);
      setConfirmReject(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  // The client's positive action: accept the profile + ask for an interview.
  // This moves the candidate to Review Accepted; the vendor then schedules it.
  const requested = stage === "REVIEW_ACCEPTED";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        onClick={() => move("REVIEW_ACCEPTED", "Interview requested")}
        disabled={busy !== null || requested}
        className="gap-1.5 bg-green-600 hover:bg-green-700"
      >
        {busy === "REVIEW_ACCEPTED" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CalendarPlus className="h-4 w-4" />
        )}
        {requested ? "Interview requested" : "Request interview"}
      </Button>

      <Button
        variant="outline"
        onClick={() => setConfirmReject(true)}
        disabled={busy !== null || stage === "REJECTED"}
        className="gap-1.5 text-destructive hover:text-destructive"
      >
        <X className="h-4 w-4" />
        {stage === "REJECTED" ? "Rejected" : "Reject"}
      </Button>

      <Dialog open={confirmReject} onOpenChange={setConfirmReject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject candidate?</DialogTitle>
            <DialogDescription>
              Reject <strong>{candidateName}</strong> for this role? Your
              staffing partner will see this on their board.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmReject(false)}
              disabled={busy !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => move("REJECTED", "Candidate rejected")}
              disabled={busy !== null}
            >
              {busy === "REJECTED" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
