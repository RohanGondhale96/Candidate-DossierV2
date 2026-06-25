"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ChevronRight, Inbox, Star } from "lucide-react";

import type { JobSummary } from "@/types/job";
import type { KanbanCard } from "@/types/kanban";
import { fitStars } from "@/lib/candidate-ui";
import { StatusBadge } from "@/components/client-review/StatusBadge";

interface JobGroup {
  job: JobSummary;
  candidates: KanbanCard[];
}

export default function ClientDashboardPage() {
  const [groups, setGroups] = useState<JobGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const jobs: JobSummary[] = (
          await fetch("/api/jobs").then((r) => r.json())
        ).jobs;
        const result = await Promise.all(
          jobs.map(async (job) => {
            const cards: KanbanCard[] = (
              await fetch(`/api/jobs/${job.id}/candidates`).then((r) => r.json())
            ).cards;
            return { job, candidates: cards };
          })
        );
        if (!cancelled) setGroups(result.filter((g) => g.candidates.length > 0));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const total = groups.reduce((n, g) => n + g.candidates.length, 0);

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Candidates for review
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Profiles your staffing partners have prepared and sent for your review.
      </p>

      {loading ? (
        <div className="mt-10 flex items-center justify-center text-sm text-gray-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : total === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center text-gray-400">
          <Inbox className="mb-3 h-8 w-8" />
          <p className="text-sm">No candidates have been sent for review yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map(({ job, candidates }) => (
            <section key={job.id}>
              <h2 className="mb-3 text-sm font-semibold text-gray-700">
                {job.title}
                <span className="ml-2 font-normal text-gray-400">
                  {candidates.length} candidate
                  {candidates.length === 1 ? "" : "s"}
                </span>
              </h2>
              <div className="overflow-hidden rounded-lg border bg-white">
                {candidates.map((c, i) => (
                  <Link
                    key={c.candidateJobId}
                    href={`/client/review/${c.candidateJobId}`}
                    className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-gray-50 ${
                      i > 0 ? "border-t" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-900">
                        {c.name}
                      </div>
                      <div className="truncate text-xs text-gray-500">
                        {c.title} · via {c.vendorName}
                      </div>
                    </div>
                    <div className="hidden shrink-0 items-center gap-1.5 text-xs text-gray-500 sm:flex">
                      <span className="text-muted-foreground">Fitscore</span>
                      <span className="font-semibold tabular-nums text-gray-700">
                        {fitStars(c.jobMatchScore)}/5
                      </span>
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    </div>
                    <StatusBadge stage={c.stage} />
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
