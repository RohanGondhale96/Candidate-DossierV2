"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  FileEdit,
  XCircle,
  ChevronDown,
  ArrowRightLeft,
  Briefcase,
  Info,
  MapPin,
  CalendarClock,
  IndianRupee,
  Download,
} from "lucide-react";
import { toast } from "sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { CommentThread } from "@/components/comments/CommentThread";
import { StatusBadge } from "@/components/client-review/StatusBadge";
import { ScaledResumePreview } from "@/components/kanban/ScaledResumePreview";
import { JobDescriptionDialog } from "@/components/resume-builder/JobDescriptionDialog";
import { useResumeStore, type ResumeServerData } from "@/stores/resumeStore";
import {
  PIPELINE_COLUMNS,
  STAGE_LABELS,
  type PipelineStage,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { initials, clarityColor } from "@/lib/candidate-ui";
import { exportResumeToPdf } from "@/lib/pdf";
import type { KanbanCard } from "@/types/kanban";

function DrawerMeta({
  icon: Icon,
  children,
}: {
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-600">
      <Icon className="h-4 w-4 shrink-0 text-gray-400" />
      <span>{children}</span>
    </div>
  );
}

export function CandidateDetailDrawer({
  card,
  open,
  onClose,
  onStageChange,
  initialTab = "resume",
}: {
  card: KanbanCard | null;
  open: boolean;
  onClose: () => void;
  onStageChange: (
    candidateJobId: string,
    newStage: PipelineStage,
    notAFitReason?: string
  ) => void | Promise<void>;
  initialTab?: "resume" | "comments";
}) {
  const [loading, setLoading] = useState(false);
  const [resumeReady, setResumeReady] = useState(false);
  const [stage, setStage] = useState<PipelineStage | null>(card?.stage ?? null);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [notAFitReason, setNotAFitReason] = useState("");
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [tab, setTab] = useState<"resume" | "comments">(initialTab);
  const [commentCount, setCommentCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [downloading, setDownloading] = useState(false);

  // Job context (populated by initFromServer once the resume loads).
  const jobTitle = useResumeStore((s) => s.jobTitle);

  // Keep local state in sync whenever a (possibly different) card is shown.
  useEffect(() => {
    setStage(card?.stage ?? null);
    setTab(initialTab);
    setCommentCount(0);
    setUnreadCount(0);
  }, [card, initialTab]);

  // Fetch unread comment count when drawer opens; mark as read immediately if
  // the drawer opened directly on the comments tab (e.g. from a notification).
  useEffect(() => {
    if (!open || !card) return;
    fetch(`/api/notifications?candidateJobId=${card.candidateJobId}`)
      .then((r) => r.json())
      .then((d) => {
        const item = d.items?.find(
          (i: { candidateJobId: string; unreadCount: number }) =>
            i.candidateJobId === card.candidateJobId
        );
        const count = item?.unreadCount ?? 0;
        setUnreadCount(count);
        if (tab === "comments" && count > 0) {
          fetch(`/api/candidate-jobs/${card.candidateJobId}/mark-comments-read`, {
            method: "POST",
          }).catch(() => {});
          setUnreadCount(0);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, card]);

  function handleTabChange(t: "resume" | "comments") {
    setTab(t);
    if (t === "comments" && card && unreadCount > 0) {
      fetch(`/api/candidate-jobs/${card.candidateJobId}/mark-comments-read`, {
        method: "POST",
      }).catch(() => {});
      setUnreadCount(0);
    }
  }

  // Re-fetch + re-init the global resume store each time the drawer opens for
  // a candidate (the store is a singleton shared with the builder page).
  useEffect(() => {
    if (!open || !card) return;
    let cancelled = false;
    setLoading(true);
    setResumeReady(false);
    fetch(`/api/candidate-jobs/${card.candidateJobId}/resume`)
      .then((r) => r.json())
      .then((data: ResumeServerData) => {
        if (cancelled) return;
        useResumeStore.getState().initFromServer(data);
        setResumeReady(true);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load resume");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [open, card]);

  async function handleMoveTo(newStage: PipelineStage) {
    if (!card || newStage === stage) return;
    setStage(newStage); // optimistic local update for badge
    await onStageChange(card.candidateJobId, newStage);
    toast.success(`Moved to ${STAGE_LABELS[newStage]}`);
  }

  async function confirmReject() {
    if (!card || !notAFitReason) return;
    setRejecting(true);
    try {
      setStage("NOT_A_FIT");
      await onStageChange(card.candidateJobId, "NOT_A_FIT", notAFitReason);
      toast.success("Marked as not a fit");
      setConfirmRejectOpen(false);
      setNotAFitReason("");
    } finally {
      setRejecting(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await exportResumeToPdf(`${card?.name ?? "Candidate"} — Profile`);
    } catch {
      toast.error("Could not generate PDF");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        className="w-full overflow-y-auto sm:max-w-2xl lg:max-w-[960px]"
        onEscapeKeyDown={(e) => {
          // Esc should close a nested layer first, not the drawer underneath it.
          if (jobDialogOpen || confirmRejectOpen || moveOpen) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          // Closing a nested dialog / dropdown must not dismiss the drawer.
          if (jobDialogOpen || confirmRejectOpen || moveOpen) e.preventDefault();
        }}
      >
        {card && (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-start justify-between gap-4 pr-8">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                    {initials(card.name)}
                  </span>
                  <div className="min-w-0">
                    <SheetTitle className="truncate text-lg leading-tight">
                      {card.name}
                    </SheetTitle>
                    {stage && <StatusBadge stage={stage} className="mt-1.5" />}
                  </div>
                </div>

                {/* Profile clarity score */}
                <div className="flex items-center rounded-xl border bg-card px-4 py-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Profile clarity</div>
                    <div
                      className="mt-0.5 text-lg font-semibold tabular-nums"
                      style={{ color: clarityColor(card.qualityScore) }}
                    >
                      {card.qualityScore != null ? `${card.qualityScore}%` : "—"}
                    </div>
                  </div>
                </div>
              </div>
              <SheetDescription className="sr-only">
                Candidate details for {card.name}
              </SheetDescription>
            </SheetHeader>

            {/* Single clickable job name → opens job-description popup */}
            {resumeReady && jobTitle && (
              <button
                type="button"
                onClick={() => setJobDialogOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-primary transition-colors hover:underline"
                title="View job description"
              >
                <Briefcase className="h-4 w-4" />
                {jobTitle}
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}

            {/* Candidate meta — mirrors the card */}
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {card.location && (
                <DrawerMeta icon={MapPin}>{card.location}</DrawerMeta>
              )}
              {card.yearsOfExperience != null && (
                <DrawerMeta icon={Briefcase}>
                  {card.yearsOfExperience} yrs
                </DrawerMeta>
              )}
              {card.noticePeriod && (
                <DrawerMeta icon={CalendarClock}>{card.noticePeriod}</DrawerMeta>
              )}
              {card.expectedSalary && (
                <DrawerMeta icon={IndianRupee}>{card.expectedSalary}</DrawerMeta>
              )}
            </div>

            {card.skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {card.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-gray-600"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Action toolbar */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <DropdownMenu open={moveOpen} onOpenChange={setMoveOpen}>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="gap-1.5">
                    <ArrowRightLeft className="h-4 w-4" />
                    Move candidate
                    <ChevronDown className="h-4 w-4 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Move to</DropdownMenuLabel>
                  {PIPELINE_COLUMNS.filter(
                    (c) => c.stage !== stage && c.stage !== "NOT_A_FIT"
                  ).map((c) => (
                    <DropdownMenuItem
                      key={c.stage}
                      onClick={() => handleMoveTo(c.stage)}
                    >
                      {STAGE_LABELS[c.stage]}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setConfirmRejectOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                    Not a Fit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  window.open(
                    `/vendor/resume-builder/${card.candidateJobId}`,
                    "_blank",
                    "noopener"
                  )
                }
              >
                <FileEdit className="h-4 w-4" />
                Edit Profile
              </Button>

            </div>

            {/* Tabs */}
            <div
              role="tablist"
              aria-label="Candidate sections"
              className="mt-5 flex items-center gap-6 border-b"
            >
              {(["resume", "comments"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => handleTabChange(t)}
                  className={cn(
                    "relative -mb-px flex items-center gap-1.5 border-b-2 px-1 pb-2.5 text-sm font-medium transition-colors",
                    tab === t
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === "resume"
                    ? "Profile"
                    : `Comments${commentCount ? ` (${commentCount})` : ""}`}
                  {t === "comments" && unreadCount > 0 && (
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                  )}
                </button>
              ))}

              {/* Download icon — right-aligned in the tab bar, only on Profile tab */}
              {tab === "resume" && resumeReady && (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  title="Download profile"
                  className="ml-auto mb-1 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            <div className="mt-4">
              {/* Comments stay mounted (hidden) so the tab count is known up front */}
              <div className={tab === "comments" ? "" : "hidden"}>
                {stage === "NOT_A_FIT" && (
                  <div className="mb-3 flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-destructive">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium">Not a fit</div>
                      {card.rejectedAtStage && (
                        <div className="text-xs text-destructive/80">
                          Marked not a fit from{" "}
                          {STAGE_LABELS[card.rejectedAtStage]}.
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <CommentThread
                  key={card.candidateJobId}
                  candidateJobId={card.candidateJobId}
                  hideHeader
                  onCountChange={setCommentCount}
                />
              </div>

              {tab === "resume" && (
                <>
                  {loading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading resume…
                    </div>
                  )}
                  {resumeReady && <ScaledResumePreview />}
                </>
              )}
            </div>

            {/* Dialogs are nested INSIDE the sheet so closing them does not
                dismiss the drawer (Radix treats them as child layers). */}
            <Dialog
              open={confirmRejectOpen}
              onOpenChange={(o) => {
                if (!o) setNotAFitReason("");
                setConfirmRejectOpen(o);
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Mark as not a fit?</DialogTitle>
                  <DialogDescription>
                    {card && (
                      <>Select a reason for moving <strong>{card.name}</strong> to Not a Fit.</>
                    )}
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
                    onClick={() => { setConfirmRejectOpen(false); setNotAFitReason(""); }}
                    disabled={rejecting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmReject}
                    disabled={rejecting || !notAFitReason}
                  >
                    Not a Fit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Job description popup */}
            <JobDescriptionDialog
              open={jobDialogOpen}
              onOpenChange={setJobDialogOpen}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
