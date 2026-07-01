"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

export interface ShareCandidate {
  candidateJobId: string;
  name: string;
  title: string | null;
  jobTitle: string;
  recruiterNotes?: string | null;
}

// Generic notes used when bulk-sharing candidates from the same job.
const BULK_NOTES = [
  "We've shortlisted these candidates based on their strong profile match and relevant experience. Each of them has been vetted and we believe they would be a great addition to your team.",
  "Please find our recommended candidates for this role. They have been carefully evaluated against your requirements and come with our strong recommendation.",
  "We're excited to share this shortlist with you. These candidates have shown excellent potential during our screening process and align well with what you're looking for.",
  "After a thorough review, we've selected these candidates as the strongest fits for your open position. We're confident they'll meet your expectations.",
  "Here's our curated shortlist for your review. Each candidate brings a unique set of skills and experience that we believe aligns with your team's needs.",
];

interface Props {
  open: boolean;
  candidates: ShareCandidate[];
  isSameJob?: boolean;
  onClose: () => void;
  onShare: (
    data: Array<{ candidateJobId: string; candidateSummary: string }>
  ) => Promise<void>;
}

export function ShareWithClientModal({
  open,
  candidates,
  isSameJob = false,
  onClose,
  onShare,
}: Props) {
  const [note, setNote] = useState("");
  const [sharing, setSharing] = useState(false);

  const count = candidates.length;
  const isBulk = count > 1;

  useEffect(() => {
    if (!open) return;
    if (count === 1) {
      // Single candidate — pre-fill with existing recruiter note.
      setNote(candidates[0]?.recruiterNotes ?? "");
    } else if (isSameJob) {
      // Bulk, same job — pre-fill with a generic note.
      setNote(BULK_NOTES[Math.floor(Math.random() * BULK_NOTES.length)]);
    } else {
      // Bulk, different jobs — leave empty.
      setNote("");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleShare() {
    setSharing(true);
    try {
      const data = candidates.map((c) => ({
        candidateJobId: c.candidateJobId,
        candidateSummary: note.trim(),
      }));
      await onShare(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to share");
    } finally {
      setSharing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-6 pb-2 pt-6">
          <DialogTitle>Share with Client</DialogTitle>
          <DialogDescription>
            {isBulk
              ? `Sharing ${count} candidates${isSameJob ? ` · ${candidates[0]?.jobTitle}` : ""}.`
              : "Optionally add a note explaining why this candidate is a good fit."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-2 pb-4">
          {/* Candidate name(s) */}
          {isBulk ? (
            <p className="mb-4 text-sm font-medium leading-relaxed text-gray-900">
              {candidates.map((c) => c.name).join(", ")}
            </p>
          ) : (
            <div className="mb-4 flex items-baseline gap-1.5">
              <span className="text-sm font-medium text-gray-900">
                {candidates[0]?.name}
              </span>
              <span className="text-xs text-muted-foreground">
                — {candidates[0]?.title ?? candidates[0]?.jobTitle}
              </span>
            </div>
          )}

          <Textarea
            placeholder={
              isBulk
                ? "Add a note for all candidates… (optional)"
                : "Why is this candidate a good fit? (optional)"
            }
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-28 resize-none text-sm"
          />
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={sharing}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={sharing} className="gap-1.5">
            {sharing && <Loader2 className="h-4 w-4 animate-spin" />}
            Share {count} candidate{count !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
