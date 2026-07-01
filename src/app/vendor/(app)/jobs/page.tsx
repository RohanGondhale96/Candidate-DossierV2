"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ChevronRight,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  Search,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { JobSummary, PipelineCounts } from "@/types/job";

// ─── Constants ───────────────────────────────────────────────────────────────

const VIEW_STORAGE_KEY = "vendor-jobs-view";

type ViewMode = "grid" | "list";

const PIPELINE_LABELS: { key: keyof PipelineCounts; label: string; color: string }[] = [
  { key: "INCOMING",  label: "Incoming",  color: "#185FA5" },
  { key: "PRESENTED", label: "In review", color: "#854F0B" },
  { key: "ACCEPTED",  label: "Accepted",  color: "#3B6D11" },
  { key: "NOT_A_FIT", label: "Not a fit", color: "#A32D2D" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusPill({ status }: { status: "ACTIVE" | "PAUSED" }) {
  const isActive = status === "ACTIVE";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.04em]",
        isActive
          ? "bg-[#EAF3DE] text-[#3B6D11]"
          : "bg-[#FAEEDA] text-[#854F0B]"
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: isActive ? "#639922" : "#EF9F27" }}
      />
      {isActive ? "Active" : "Paused"}
    </span>
  );
}

function PipelineGrid({ pipeline }: { pipeline: PipelineCounts }) {
  return (
    <div className="grid grid-cols-4 divide-x divide-[#EFEFEC]">
      {PIPELINE_LABELS.map(({ key, label, color }) => (
        <div key={key} className="flex flex-col items-center gap-0.5 px-2 py-2.5">
          <span className="text-[18px] font-bold leading-none" style={{ color }}>
            {pipeline[key]}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.04em] text-[#9CA3AF]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function PipelineRow({ pipeline }: { pipeline: PipelineCounts }) {
  return (
    <div className="grid grid-cols-4 overflow-hidden rounded-md border border-[#E5E7EB]">
      {PIPELINE_LABELS.map(({ key, label, color }, i) => (
        <div
          key={key}
          className={cn(
            "flex flex-col items-center justify-center px-4 py-2",
            i < PIPELINE_LABELS.length - 1 && "border-r border-[#E5E7EB]"
          )}
        >
          <span className="text-[17px] font-semibold leading-none" style={{ color }}>
            {pipeline[key]}
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.04em] text-[#9CA3AF]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

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
        onClick={() => onChange("grid")}
        title="Grid view"
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded transition-colors",
          value === "grid"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
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
    </div>
  );
}

// ─── Job cards ───────────────────────────────────────────────────────────────

function JobGridCard({
  job,
  onClick,
}: {
  job: JobSummary;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col overflow-hidden rounded-[12px] border border-[#D8D6CE] bg-white text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-shadow duration-150 hover:shadow-[0_4px_12px_rgba(0,0,0,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0076FB]"
      style={{ borderWidth: "0.5px" }}
    >
      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 px-5 pb-4 pt-5">
        {/* Title */}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug text-[#2A2A2A] transition-colors group-hover:text-[#0076FB]">
            {job.title}
          </h3>
          <p className="mt-1 text-[13px] text-[#747474]">{job.clientName}</p>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {job.location && (
            <span className="flex items-center gap-1.5 text-[12px] text-[#9CA3AF]">
              <MapPin className="h-3 w-3 shrink-0" />
              {job.location}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[12px] text-[#9CA3AF]">
            <Users className="h-3 w-3 shrink-0" />
            {job.openPositions} open position{job.openPositions !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Pipeline counts footer */}
      <div className="border-t border-[#EFEFEC] bg-[#FAFAF8]">
        <PipelineGrid pipeline={job.pipeline} />
      </div>
    </button>
  );
}

function JobListRow({
  job,
  onClick,
}: {
  job: JobSummary;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-stretch gap-4 rounded-[8px] border border-[#D8D6CE] bg-white px-5 py-4 text-left transition-shadow duration-150 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0076FB]"
      style={{ borderWidth: "0.5px" }}
    >
      {/* Title + client */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-semibold text-[#2A2A2A] transition-colors group-hover:text-[#0076FB]">
          {job.title}
        </p>
        <p className="mt-2 truncate text-[12px] text-[#747474]">
          {job.clientName}
          {job.location ? ` · ${job.location}` : ""}
          {" · "}
          {job.openPositions} open
        </p>
      </div>

      {/* Pipeline summary */}
      <div className="hidden shrink-0 lg:flex">
        <PipelineRow pipeline={job.pipeline} />
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 self-center text-[#C4C4C4] group-hover:text-[#9CA3AF]" />
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [view, setView] = useState<ViewMode>("list");

  // Restore view mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_STORAGE_KEY);
    if (saved === "grid" || saved === "list") setView(saved);
  }, []);

  function handleViewChange(v: ViewMode) {
    setView(v);
    localStorage.setItem(VIEW_STORAGE_KEY, v);
  }

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []))
      .catch(() => toast.error("Could not load jobs"))
      .finally(() => setLoading(false));
  }, []);

  // Derived filter options
  const locations = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.location).filter(Boolean))).sort() as string[],
    [jobs]
  );
  const clients = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.clientName))).sort(),
    [jobs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = jobs.filter((j) => {
      if (locationFilter && j.location !== locationFilter) return false;
      if (clientFilter && j.clientName !== clientFilter) return false;
      if (!q) return true;
      return (
        j.title.toLowerCase().includes(q) ||
        j.clientName.toLowerCase().includes(q) ||
        (j.location ?? "").toLowerCase().includes(q)
      );
    });
    if (sortBy === "open_desc") result = [...result].sort((a, b) => b.openPositions - a.openPositions);
    if (sortBy === "open_asc")  result = [...result].sort((a, b) => a.openPositions - b.openPositions);
    return result;
  }, [jobs, query, locationFilter, clientFilter, sortBy]);

  const activeFilterCount = [locationFilter, clientFilter, sortBy].filter(Boolean).length;

  function goToJob(jobId: string) {
    router.push(`/vendor/candidates?jobId=${jobId}`);
  }

  return (
    <div className="flex h-full flex-col">
      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-[#E0E0E0] bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs or clients…"
              className="h-9 border-[#D8D6CE] bg-white pl-9 text-[13px] placeholder:text-[#BBBBBB] focus-visible:ring-[#0076FB]"
            />
          </div>

          {/* Filter selects */}
          <div className="flex items-center gap-2">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-9 rounded-md border border-[#D8D6CE] bg-white pl-3 pr-8 text-[13px] text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#0076FB]"
            >
              <option value="">All locations</option>
              {locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>

            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="h-9 rounded-md border border-[#D8D6CE] bg-white pl-3 pr-8 text-[13px] text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#0076FB]"
            >
              <option value="">All clients</option>
              {clients.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 rounded-md border border-[#D8D6CE] bg-white pl-3 pr-8 text-[13px] text-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#0076FB]"
            >
              <option value="">Sort: default</option>
              <option value="open_desc">Open positions: high → low</option>
              <option value="open_asc">Open positions: low → high</option>
            </select>

            {activeFilterCount > 0 && (
              <button
                onClick={() => { setLocationFilter(""); setClientFilter(""); setSortBy(""); }}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[12px] text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#2A2A2A]"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          <div className="ml-auto">
            <ViewSwitcher value={view} onChange={handleViewChange} />
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-[#9CA3AF]">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading jobs…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-sm text-[#9CA3AF]">
            <Briefcase className="h-10 w-10 opacity-25" />
            <p className="font-medium">No jobs found</p>
            {query && (
              <p className="text-[12px]">Try adjusting your search</p>
            )}
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((job) => (
              <JobGridCard
                key={job.id}
                job={job}
                onClick={() => goToJob(job.id)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((job) => (
              <JobListRow
                key={job.id}
                job={job}
                onClick={() => goToJob(job.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
