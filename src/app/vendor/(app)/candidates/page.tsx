"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Eye, Inbox, Loader2, Search, Send, UserX, Users, LayoutGrid, List, X } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "next/navigation";
import type { KanbanCard } from "@/types/kanban";
import type { PipelineStage } from "@/lib/constants";
import { PIPELINE_STAGES, STAGE_SHORT_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CandidateListCard } from "@/components/kanban/CandidateListCard";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { CandidateDetailDrawer } from "@/components/kanban/CandidateDetailDrawer";
import {
  ShareWithClientModal,
  type ShareCandidate,
} from "@/components/kanban/ShareWithClientModal";

type ViewMode = "list" | "kanban";

const STAGE_ICONS = {
  INCOMING: Inbox,
  PRESENTED: Eye,
  ACCEPTED: CheckCircle2,
  NOT_A_FIT: UserX,
} as const;

const VIEW_STORAGE_KEY = "vendor-candidates-view";

function ViewSwitcher({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div className="flex items-center rounded-md border bg-background p-0.5">
      <button
        onClick={() => onChange("list")}
        title="List view"
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded transition-colors",
          value === "list"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <List className="h-4 w-4" />
      </button>
      <button
        onClick={() => onChange("kanban")}
        title="Kanban view"
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded transition-colors",
          value === "kanban"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function CandidatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const openCardParam = searchParams.get("openCard");

  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [noticePeriodFilter, setNoticePeriodFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [activeTab, setActiveTab] = useState<PipelineStage>("INCOMING");
  const [view, setView] = useState<ViewMode>("list");

  // Detail drawer
  const [openCard, setOpenCard] = useState<KanbanCard | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerInitialTab, setDrawerInitialTab] = useState<"resume" | "comments">("resume");

  // Selection state (INCOMING tab only)
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Share modal
  const [shareOpen, setShareOpen] = useState(false);

  // Restore persisted view on mount
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    if (saved === "kanban") setView("kanban");
    else if (saved === "list" || saved === "tabs") setView("list");
  }, []);

  function handleViewChange(v: ViewMode) {
    setView(v);
    localStorage.setItem(VIEW_STORAGE_KEY, v);
    // Clear selection when switching to kanban
    if (v === "kanban") setSelected(new Set());
  }

  useEffect(() => {
    fetch("/api/candidates")
      .then((r) => r.json())
      .then((d) => setCards(d.cards ?? []))
      .catch(() => toast.error("Could not load candidates"))
      .finally(() => setLoading(false));
  }, []);

  // Open drawer from notification bell link
  useEffect(() => {
    if (!openCardParam || cards.length === 0) return;
    const card = cards.find((c) => c.candidateJobId === openCardParam);
    if (card) {
      setOpenCard(card);
      setDrawerInitialTab("comments");
      setDrawerOpen(true);
      router.replace("/vendor/candidates");
    }
  }, [cards, openCardParam, router]);

  function handleTabChange(stage: string) {
    setActiveTab(stage as PipelineStage);
    setSelected(new Set());
  }

  const changeStage = useCallback(
    async (id: string, newStage: PipelineStage, notAFitReason?: string) => {
      const prev = cards;
      setCards((cs) =>
        cs.map((c) =>
          c.candidateJobId === id
            ? {
                ...c,
                stage: newStage,
                rejectedAtStage:
                  newStage === "NOT_A_FIT"
                    ? c.stage
                    : c.stage === "NOT_A_FIT"
                      ? null
                      : c.rejectedAtStage,
              }
            : c
        )
      );
      try {
        const res = await fetch(`/api/candidate-jobs/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: newStage, ...(notAFitReason ? { notAFitReason } : {}) }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Update failed");
        }
      } catch (e) {
        setCards(prev);
        toast.error(e instanceof Error ? e.message : "Could not move candidate");
      }
    },
    [cards]
  );

  const handleNotAFit = useCallback(
    async (id: string) => {
      await changeStage(id, "NOT_A_FIT");
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success("Marked as not a fit");
    },
    [changeStage]
  );

  function openDrawer(card: KanbanCard) {
    setOpenCard(card);
    setDrawerInitialTab("resume");
    setDrawerOpen(true);
  }

  function handleSelect(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const noticePeriods = useMemo(
    () =>
      Array.from(
        new Set(cards.map((c) => c.noticePeriod).filter(Boolean))
      ).sort() as string[],
    [cards]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = jobId ? cards.filter((c) => c.jobId === jobId) : cards;

    if (q) {
      base = base.filter((c) => {
        const haystack = [c.name, c.jobTitle, ...c.skills].join(" ").toLowerCase();
        return haystack.includes(q);
      });
    }

    if (noticePeriodFilter) {
      base = base.filter((c) => c.noticePeriod === noticePeriodFilter);
    }

    if (sortBy === "clarity_desc") {
      base = [...base].sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));
    } else if (sortBy === "clarity_asc") {
      base = [...base].sort((a, b) => (a.qualityScore ?? 0) - (b.qualityScore ?? 0));
    } else if (sortBy === "exp_desc") {
      base = [...base].sort((a, b) => (b.yearsOfExperience ?? 0) - (a.yearsOfExperience ?? 0));
    } else if (sortBy === "exp_asc") {
      base = [...base].sort((a, b) => (a.yearsOfExperience ?? 0) - (b.yearsOfExperience ?? 0));
    } else if (sortBy === "name_asc") {
      base = [...base].sort((a, b) => a.name.localeCompare(b.name));
    }

    const byStage: Record<PipelineStage, KanbanCard[]> = {
      INCOMING: [],
      PRESENTED: [],
      ACCEPTED: [],
      NOT_A_FIT: [],
    };
    for (const c of base) byStage[c.stage]?.push(c);
    return byStage;
  }, [cards, query, jobId, noticePeriodFilter, sortBy]);

  const filteredFlat = useMemo(
    () => Object.values(filtered).flat(),
    [filtered]
  );

  const selectedCandidates: ShareCandidate[] = useMemo(() => {
    return filtered.INCOMING.filter((c) => selected.has(c.candidateJobId)).map(
      (c) => ({
        candidateJobId: c.candidateJobId,
        name: c.name,
        title: c.title,
        jobTitle: c.jobTitle,
        recruiterNotes: c.recruiterNotes,
      })
    );
  }, [filtered.INCOMING, selected]);

  const isSameJob = useMemo(() => {
    const sel = filtered.INCOMING.filter((c) => selected.has(c.candidateJobId));
    if (sel.length < 2) return false;
    const jobs = new Set(sel.map((c) => c.jobId));
    return jobs.size === 1;
  }, [filtered.INCOMING, selected]);

  function handleSingleShare(card: KanbanCard) {
    setSelected(new Set([card.candidateJobId]));
    setShareOpen(true);
  }

  async function handleShare(
    data: Array<{ candidateJobId: string; candidateSummary: string }>
  ) {
    const res = await fetch("/api/candidate-jobs/bulk-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidates: data }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to share candidates");
    }
    const { shared } = await res.json();
    const sharedIds = new Set(data.map((d) => d.candidateJobId));
    setCards((cs) =>
      cs.map((c) =>
        sharedIds.has(c.candidateJobId) && c.stage === "INCOMING"
          ? { ...c, stage: "PRESENTED" as PipelineStage }
          : c
      )
    );
    setSelected(new Set());
    setShareOpen(false);
    toast.success(
      `${shared} candidate${shared !== 1 ? "s" : ""} shared with client`
    );
  }

  const activeFilterCount = [noticePeriodFilter, sortBy].filter(Boolean).length;


  // Find the job title for the active filter
  const filteredJobTitle = jobId
    ? cards.find((c) => c.jobId === jobId)?.jobTitle ?? null
    : null;

  const toolbar = (
    <div className="shrink-0 border-b bg-background px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 min-w-[200px] flex-1 items-center overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
          {jobId && filteredJobTitle ? (
            <span className="ml-2 flex shrink-0 items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-medium text-[#1D4ED8]">
              {filteredJobTitle}
              <button
                onClick={() => router.push("/vendor/candidates")}
                aria-label="Clear job filter"
                className="rounded-full p-0.5 hover:bg-[#DBEAFE]"
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
            placeholder="Search by name, job, or skill…"
            className="h-full flex-1 border-none bg-transparent px-2 shadow-none focus-visible:ring-0"
          />
        </div>
        <select
          value={noticePeriodFilter}
          onChange={(e) => setNoticePeriodFilter(e.target.value)}
          className="h-9 rounded-md border border-[#D8D6CE] bg-white pl-3 pr-8 text-[13px] text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#0076FB]"
        >
          <option value="">All notice periods</option>
          {noticePeriods.map((np) => (
            <option key={np} value={np}>{np}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="h-9 rounded-md border border-[#D8D6CE] bg-white pl-3 pr-8 text-[13px] text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#0076FB]"
        >
          <option value="">Sort: default</option>
          <option value="clarity_desc">Profile clarity: high → low</option>
          <option value="clarity_asc">Profile clarity: low → high</option>
          <option value="exp_desc">Experience: high → low</option>
          <option value="exp_asc">Experience: low → high</option>
          <option value="name_asc">Name: A → Z</option>
        </select>
        {activeFilterCount > 0 && (
          <button
            onClick={() => { setNoticePeriodFilter(""); setSortBy(""); }}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#2A2A2A]"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
        <div className="ml-auto">
          <ViewSwitcher value={view} onChange={handleViewChange} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative flex h-full overflow-hidden">
      {loading ? (
        <div className="flex h-full flex-1 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : cards.length === 0 ? (
        <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <Users className="h-8 w-8 opacity-30" />
          No candidates in your pipeline yet.
        </div>
      ) : view === "kanban" ? (
        <div className="flex h-full flex-1 flex-col">
          {toolbar}
          <div className="min-h-0 flex-1 overflow-hidden">
            <KanbanBoard
              cards={filteredFlat}
              onStageChange={changeStage}
              onReject={handleNotAFit}
              onShare={handleSingleShare}
              onOpen={openDrawer}
            />
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-1">
          {/* Pipeline sidebar */}
          <aside className="w-52 shrink-0 border-r bg-background">
            <div className="overflow-y-auto">
              <p className="px-4 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
                Pipeline
              </p>
              {PIPELINE_STAGES.map((stage) => {
                const count = filtered[stage].length;
                const active = activeTab === stage;
                const Icon = STAGE_ICONS[stage];
                return (
                  <button
                    key={stage}
                    onClick={() => handleTabChange(stage)}
                    className={cn(
                      "flex w-full items-center justify-between border-l-2 px-4 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 shrink-0" />
                      {STAGE_SHORT_LABELS[stage]}
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
            {toolbar}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto max-w-4xl space-y-2 px-6 pb-32 pt-4">
                {filtered[activeTab].length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    No candidates in this stage
                    {query ? " matching your search" : ""}.
                  </p>
                ) : (
                  filtered[activeTab].map((card) => (
                    <CandidateListCard
                      key={card.candidateJobId}
                      card={card}
                      selectable={activeTab === "INCOMING"}
                      selected={selected.has(card.candidateJobId)}
                      onSelect={handleSelect}
                      onOpen={openDrawer}
                      onReject={handleNotAFit}
                      onShare={handleSingleShare}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating selection bar — list view only */}
      {view === "list" && selected.size > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center pb-6">
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl border bg-white px-5 py-3.5 shadow-xl ring-1 ring-black/5">
            <span className="text-sm font-medium text-gray-700">
              {selected.size} candidate{selected.size !== 1 ? "s" : ""}{" "}
              selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              Clear
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setShareOpen(true)}
            >
              <Send className="h-4 w-4" />
              Share with Client
            </Button>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      <CandidateDetailDrawer
        card={openCard}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStageChange={changeStage}
        initialTab={drawerInitialTab}
      />

      {/* Share modal */}
      <ShareWithClientModal
        open={shareOpen}
        candidates={selectedCandidates}
        isSameJob={isSameJob}
        onClose={() => setShareOpen(false)}
        onShare={handleShare}
      />
    </div>
  );
}
