"use client";

import { useState } from "react";
import { CheckCircle, X, Loader2 } from "lucide-react";
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
  const [confirmNotAFit, setConfirmNotAFit] = useState(false);
  const [notAFitReason, setNotAFitReason] = useState("");

  async function move(next: PipelineStage, message: string, reason?: string) {
    setBusy(next);
    try {
      const res = await fetch(`/api/candidate-jobs/${candidateJobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: next, ...(reason ? { notAFitReason: reason } : {}) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Action failed");
      }
      onChanged(next);
      toast.success(message);
      setConfirmNotAFit(false);
      setNotAFitReason("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  const accepted = stage === "ACCEPTED";
  const notAFit = stage === "NOT_A_FIT";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        onClick={() => setConfirmNotAFit(true)}
        disabled={busy !== null || notAFit}
        className="gap-1.5 text-destructive hover:text-destructive"
      >
        <X className="h-4 w-4" />
        Not a Fit
      </Button>

      <Button
        onClick={() => move("ACCEPTED", "Candidate accepted")}
        disabled={busy !== null || accepted || notAFit}
        className="gap-1.5 bg-green-600 hover:bg-green-700"
      >
        {busy === "ACCEPTED" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        {accepted ? "Accepted" : "Accept"}
      </Button>

      <Dialog open={confirmNotAFit} onOpenChange={(o) => { if (!o) setNotAFitReason(""); setConfirmNotAFit(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as not a fit?</DialogTitle>
            <DialogDescription>
              Select a reason for marking <strong>{candidateName}</strong> as not a fit.
            </DialogDescription>
          </DialogHeader>

          <select
            value={notAFitReason}
            onChange={(e) => setNotAFitReason(e.target.value)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select a reason…</option>
            <option>Candidate is not interested</option>
            <option>Wrong contact details</option>
            <option>Skills/Experience mismatch</option>
            <option>Qualification mismatch</option>
            <option>Notice period mismatch</option>
            <option>Compensation expectation mismatch</option>
            <option>Position has been filled</option>
            <option>Position cancelled</option>
            <option>Candidate failed background check</option>
            <option>Offer was not accepted</option>
            <option>Blacklisted candidate. Do not consider</option>
            <option>Other</option>
          </select>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setConfirmNotAFit(false); setNotAFitReason(""); }}
              disabled={busy !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => move("NOT_A_FIT", "Marked as not a fit", notAFitReason)}
              disabled={busy !== null || !notAFitReason}
            >
              {busy === "NOT_A_FIT" && <Loader2 className="h-4 w-4 animate-spin" />}
              Not a Fit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
