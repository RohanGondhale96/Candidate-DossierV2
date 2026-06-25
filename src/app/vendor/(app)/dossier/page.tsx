"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, KanbanSquare, Search } from "lucide-react";
import { toast } from "sonner";

import type { KanbanCard } from "@/types/kanban";
import type { PipelineStage } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { CandidateDetailDrawer } from "@/components/kanban/CandidateDetailDrawer";

type FitmentBucket = "all" | "strong" | "moderate" | "weak";
type ClarityBucket = "all" | "high" | "medium" | "low";

export default function DossierPage() {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [fitment, setFitment] = useState<FitmentBucket>("all");
  const [clarity, setClarity] = useState<ClarityBucket>("all");
  const [openCard, setOpenCard] = useState<KanbanCard | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Load every candidate across all of the vendor's jobs (board is aggregated).
  useEffect(() => {
    fetch("/api/candidates")
      .then((r) => r.json())
      .then((d) => setCards(d.cards ?? []))
      .catch(() => toast.error("Could not load candidates"))
      .finally(() => setLoading(false));
  }, []);

  const changeStage = useCallback(
    async (id: string, newStage: PipelineStage) => {
      const prev = cards;
      setCards((cs) =>
        cs.map((c) =>
          c.candidateJobId === id
            ? {
                ...c,
                stage: newStage,
                rejectedAtStage:
                  newStage === "REJECTED"
                    ? c.stage
                    : c.stage === "REJECTED"
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
          body: JSON.stringify({ stage: newStage }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "Update failed");
        }
      } catch (e) {
        setCards(prev); // revert
        toast.error(e instanceof Error ? e.message : "Could not move candidate");
      }
    },
    [cards]
  );

  const handleReject = useCallback(
    async (id: string) => {
      await changeStage(id, "REJECTED");
      toast.success("Candidate rejected");
    },
    [changeStage]
  );

  function openDrawer(card: KanbanCard) {
    setOpenCard(card);
    setDrawerOpen(true);
  }

  // Live, client-side filtering by search text + fitment bucket.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      if (q) {
        const haystack = [c.name, c.jobTitle, ...c.skills]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (fitment !== "all") {
        const s = c.jobMatchScore;
        if (s == null) return false;
        if (fitment === "strong" && s < 75) return false;
        if (fitment === "moderate" && (s < 50 || s >= 75)) return false;
        if (fitment === "weak" && s >= 50) return false;
      }
      if (clarity !== "all") {
        const cl = c.qualityScore;
        if (cl == null) return false;
        if (clarity === "high" && cl < 80) return false;
        if (clarity === "medium" && (cl < 60 || cl >= 80)) return false;
        if (clarity === "low" && cl >= 60) return false;
      }
      return true;
    });
  }, [cards, query, fitment, clarity]);

  const isFiltered = filtered.length !== cards.length;

  return (
    <div className="flex h-full flex-col">
      {/* Header + search/filter bar */}
      <div className="shrink-0 px-6 py-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <KanbanSquare className="h-4 w-4" />
          </span>
          <div>
            <h1 className="text-sm font-semibold leading-tight">Dossier board</h1>
            <p className="text-xs leading-tight text-muted-foreground">
              {filtered.length}
              {isFiltered ? ` of ${cards.length}` : ""} candidate
              {cards.length === 1 ? "" : "s"} in pipeline
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by candidate, job title, or skill…"
              className="h-9 bg-background pl-9"
            />
          </div>
          <Select
            value={fitment}
            onValueChange={(v) => setFitment(v as FitmentBucket)}
          >
            <SelectTrigger className="h-9 w-[180px] bg-background">
              <SelectValue placeholder="Fitscore" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fitscore</SelectItem>
              <SelectItem value="strong">Strong Match (75–100)</SelectItem>
              <SelectItem value="moderate">Moderate (50–74)</SelectItem>
              <SelectItem value="weak">Weak (0–49)</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={clarity}
            onValueChange={(v) => setClarity(v as ClarityBucket)}
          >
            <SelectTrigger className="h-9 w-[190px] bg-background">
              <SelectValue placeholder="Profile clarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Profile clarity</SelectItem>
              <SelectItem value="high">High (80–100)</SelectItem>
              <SelectItem value="medium">Medium (60–79)</SelectItem>
              <SelectItem value="low">Low (0–59)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : cards.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No candidates in your pipeline yet.
          </div>
        ) : (
          <KanbanBoard
            cards={filtered}
            onStageChange={changeStage}
            onReject={handleReject}
            onOpen={openDrawer}
          />
        )}
      </div>

      <CandidateDetailDrawer
        card={openCard}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStageChange={changeStage}
      />
    </div>
  );
}
