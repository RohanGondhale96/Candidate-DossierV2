"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Inbox,
  Loader2,
  Search,
  UserX,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { JobSummary } from "@/types/job";
import type { KanbanCard, PipelineStage } from "@/types/kanban";
import { StatusBadge } from "@/components/client-review/StatusBadge";

// ─── Constants ────────────────────────────────────────────────────────────────

const CLIENT_STAGES: { stage: PipelineStage; label: string; icon: React.ElementType }[] = [
  { stage: "PRESENTED", label: "In Review", icon: Eye },
  { stage: "ACCEPTED",  label: "Accepted",  icon: CheckCircle2 },
  { stage: "NOT_A_FIT", label: "Not a Fit", icon: UserX },
];

// ─── Client candidate card ────────────────────────────────────────────────────

function ClientCandidateCard({
  card,
  onAccept,
  onNotAFit,
  onClick,
}: {
  card: KanbanCard;
  onAccept: (id: string) => Promise<void>;
  onNotAFit: (id: string) => void;
  onClick: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handleAccept(e: React.MouseEvent) {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await onAccept(card.candidateJobId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="row"
      className={cn(
        "group relative cursor-pointer rounded bg-white px-4 py-4",
        "border border-[#E5E7EB]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.08)]",
        "transition-shadow duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.10)]"
      )}
      onClick={() => onClick(card.candidateJobId)}
    >
      {/* Top row: content + actions */}
      <div className="flex items-start gap-3">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-[22px] text-[#2A2A2A] transition-colors group-hover:text-[#0076FB]">
            {card.name}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-[#747474]">
            {card.jobTitle}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-[13px] text-[#4B5563]">
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
              {card.yearsOfExperience != null
                ? `${card.yearsOfExperience} yrs exp`
                : "—"}
            </span>
            <span className="flex items-center gap-1.5 text-[13px] text-[#4B5563]">
              <Clock className="h-3.5 w-3.5 shrink-0 text-[#9CA3AF]" />
              {card.noticePeriod ?? "—"}
            </span>
            {card.location && (
              <span className="text-[13px] text-[#4B5563]">{card.location}</span>
            )}
          </div>
        </div>

        {/* Right side: status badge or actions */}
        <div
          className="flex shrink-0 flex-col items-end gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {card.stage === "PRESENTED" ? (
            <div className="flex items-center gap-2">
              <button
                disabled={busy}
                onClick={handleAccept}
                title="Accept"
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md border border-[#D1FAE5] bg-[#F0FDF4] px-3 text-[12px] font-medium text-[#3B6D11]",
                  "transition-colors hover:bg-[#DCFCE7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B6D11]",
                  "disabled:cursor-not-allowed disabled:opacity-40"
                )}
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Accept
              </button>
              <button
                disabled={busy}
                onClick={(e) => { e.stopPropagation(); onNotAFit(card.candidateJobId); }}
                title="Not a Fit"
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md border border-[#FEE2E2] bg-[#FFF5F5] px-3 text-[12px] font-medium text-[#A32D2D]",
                  "transition-colors hover:bg-[#FEE2E2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A32D2D]",
                  "disabled:cursor-not-allowed disabled:opacity-40"
                )}
              >
                <UserX className="h-3.5 w-3.5" />
                Not a Fit
              </button>
            </div>
          ) : (
            <StatusBadge stage={card.stage} />
          )}
        </div>
      </div>

      {/* Full-width recruiter note */}
      {(card.candidateSummary || card.recruiterNotes) && (
        <p className="mt-2 line-clamp-2 border-t border-[#F3F4F6] pt-2 text-[13px] italic leading-relaxed text-[#4B5563]">
          &ldquo;{card.candidateSummary || card.recruiterNotes}&rdquo;
        </p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientCandidatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobIdFilter = searchParams.get("jobId") ?? "";

  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PipelineStage>("PRESENTED");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("");

  // Load all candidates across all jobs
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function load() {
      try {
        const allJobs: JobSummary[] = (
          await fetch("/api/jobs").then((r) => r.json())
        ).jobs ?? [];

        const allCards = (
          await Promise.all(
            allJobs.map((job) =>
              fetch(`/api/jobs/${job.id}/candidates`)
                .then((r) => r.json())
                .then((d) => (d.cards ?? []) as KanbanCard[])
                .catch(() => [] as KanbanCard[])
            )
          )
        ).flat();

        if (!cancelled) {
          setJobs(allJobs);
          setCards(allCards);
        }
      } catch {
        if (!cancelled) toast.error("Could not load candidates");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const [pendingRejectId, setPendingRejectId] = useState<string | null>(null);
  const [notAFitReason, setNotAFitReason] = useState("");

  // Optimistic stage change
  const changeStage = useCallback(
    async (candidateJobId: string, newStage: PipelineStage, reason?: string) => {
      const prev = cards.find((c) => c.candidateJobId === candidateJobId);
      if (!prev) return;
      setCards((all) =>
        all.map((c) =>
          c.candidateJobId === candidateJobId ? { ...c, stage: newStage } : c
        )
      );
      try {
        const res = await fetch(`/api/candidate-jobs/${candidateJobId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: newStage, ...(reason ? { notAFitReason: reason } : {}) }),
        });
        if (!res.ok) throw new Error(await res.text());
        toast.success(
          newStage === "ACCEPTED" ? "Candidate accepted" : "Candidate marked as not a fit"
        );
      } catch (err) {
        setCards((all) =>
          all.map((c) =>
            c.candidateJobId === candidateJobId ? { ...c, stage: prev.stage } : c
          )
        );
        toast.error(err instanceof Error ? err.message : "Could not update stage");
      }
    },
    [cards]
  );

  function confirmNotAFit() {
    if (!pendingRejectId || !notAFitReason) return;
    changeStage(pendingRejectId, "NOT_A_FIT", notAFitReason);
    setPendingRejectId(null);
    setNotAFitReason("");
  }

  // Derived: filtered job label for the chip
  const filterJob = useMemo(
    () => jobs.find((j) => j.id === jobIdFilter),
    [jobs, jobIdFilter]
  );

  // Filtered + sorted cards for active tab
  const visibleCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = cards.filter((c) => {
      if (c.stage !== activeTab) return false;
      if (jobIdFilter && c.jobId !== jobIdFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.jobTitle.toLowerCase().includes(q)
      );
    });
    if (sortBy === "name_asc")
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "name_desc")
      result = [...result].sort((a, b) => b.name.localeCompare(a.name));
    if (sortBy === "exp_desc")
      result = [...result].sort(
        (a, b) => (b.yearsOfExperience ?? 0) - (a.yearsOfExperience ?? 0)
      );
    return result;
  }, [cards, activeTab, jobIdFilter, query, sortBy]);

  // Tab counts (respecting job filter but not search)
  const tabCounts = useMemo(
    () =>
      Object.fromEntries(
        CLIENT_STAGES.map(({ stage }) => [
          stage,
          cards.filter(
            (c) => c.stage === stage && (!jobIdFilter || c.jobId === jobIdFilter)
          ).length,
        ])
      ) as Record<PipelineStage, number>,
    [cards, jobIdFilter]
  );

  return (
    <div className="relative flex h-full overflow-hidden">
      {loading ? (
        <div className="flex h-full flex-1 items-center justify-center text-sm text-[#9CA3AF]">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading candidates…
        </div>
      ) : (
        <div className="flex h-full flex-1">
          {/* Pipeline sidebar */}
          <aside className="w-52 shrink-0 border-r bg-background">
            <div className="overflow-y-auto">
              <p className="px-4 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                Pipeline
              </p>
              {CLIENT_STAGES.map(({ stage, label, icon: Icon }) => {
                const count = tabCounts[stage] ?? 0;
                const active = activeTab === stage;
                return (
                  <button
                    key={stage}
                    onClick={() => setActiveTab(stage)}
                    className={cn(
                      "flex w-full items-center justify-between border-l-2 px-4 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </span>
                    <span
                      className={cn(
                        "tabular-nums text-[12px] font-semibold",
                        active ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right panel: toolbar + cards */}
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Toolbar */}
            <div className="shrink-0 border-b bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 min-w-[200px] flex-1 items-center overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
                  {filterJob ? (
                    <span className="ml-2 flex shrink-0 items-center gap-1 rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-medium text-[#0076FB]">
                      {filterJob.title}
                      <button
                        onClick={() => router.push("/client/candidates")}
                        aria-label="Clear job filter"
                        className="ml-0.5 rounded-full p-0.5 hover:bg-[#BFDBFE]"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ) : (
                    <Search className="ml-3 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search candidates…"
                    className="h-full flex-1 border-none bg-transparent px-2 text-[13px] shadow-none focus-visible:ring-0"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 rounded-md border border-[#D8D6CE] bg-white pl-3 pr-8 text-[13px] text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#0076FB]"
                >
                  <option value="">Sort: default</option>
                  <option value="name_asc">Name: A → Z</option>
                  <option value="name_desc">Name: Z → A</option>
                  <option value="exp_desc">Experience: high → low</option>
                </select>
              </div>
            </div>

            {/* Cards */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F8FA] px-6 py-6">
              {visibleCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-24 text-sm text-[#9CA3AF]">
                  <Inbox className="h-10 w-10 opacity-25" />
                  <p className="font-medium">
                    {query
                      ? "No candidates match your search"
                      : activeTab === "PRESENTED"
                      ? "No candidates are currently in review"
                      : activeTab === "ACCEPTED"
                      ? "No candidates have been accepted yet"
                      : "No candidates have been rejected yet"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {visibleCards.map((card) => (
                    <ClientCandidateCard
                      key={card.candidateJobId}
                      card={card}
                      onAccept={(id) => changeStage(id, "ACCEPTED")}
                      onNotAFit={(id) => setPendingRejectId(id)}
                      onClick={(id) => router.push(`/client/review/${id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Not a Fit reason dialog */}
      <Dialog
        open={pendingRejectId !== null}
        onOpenChange={(o) => {
          if (!o) {
            setPendingRejectId(null);
            setNotAFitReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as not a fit?</DialogTitle>
            <DialogDescription>
              Select a reason for marking this candidate as not a fit.
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
              onClick={() => {
                setPendingRejectId(null);
                setNotAFitReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmNotAFit}
              disabled={!notAFitReason}
            >
              Not a Fit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
