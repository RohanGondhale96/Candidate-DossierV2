"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronRight, History, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useResumeStore } from "@/stores/resumeStore";
import type { ResumeContent } from "@/types/resume";

interface VersionItem {
  id: string;
  versionNumber: number;
  changeNote: string | null;
  createdAt: string;
}

export function VersionHistory() {
  const candidateJobId = useResumeStore((s) => s.candidateJobId);
  const saveTick = useResumeStore((s) => s.saveTick);
  const applyRestored = useResumeStore((s) => s.applyRestored);

  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [restoring, setRestoring] = useState<number | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!candidateJobId) return;
    try {
      const res = await fetch(`/api/candidate-jobs/${candidateJobId}/versions`);
      if (!res.ok) return;
      const data = await res.json();
      setVersions(data.versions ?? []);
    } catch {
      /* ignore */
    }
  }, [candidateJobId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions, saveTick]);

  async function restore(versionNumber: number) {
    if (!candidateJobId) return;
    setRestoring(versionNumber);
    try {
      const res = await fetch(
        `/api/candidate-jobs/${candidateJobId}/versions/${versionNumber}/restore`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Restore failed");
      const data = await res.json();
      applyRestored({
        content: data.resume.content as ResumeContent,
        templateId: data.resume.templateId,
        accentColor: data.resume.accentColor,
        fontFamily: data.resume.fontFamily ?? "",
        logoUrl: data.resume.logoUrl,
        logoHidden: data.resume.logoHidden ?? false,
        jobMatchScore: data.resume.jobMatchScore,
        qualityScore: data.resume.qualityScore,
      });
      toast.success(`Restored version ${versionNumber}`);
      fetchVersions();
    } catch {
      toast.error("Could not restore version");
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-xs font-medium text-gray-600 hover:text-gray-900"
      >
        <span className="flex items-center gap-1.5">
          <History className="h-3.5 w-3.5" />
          Version history ({versions.length})
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>

      {open && (
        <div className="mt-2 max-h-56 space-y-1 overflow-auto pr-1">
          {versions.length === 0 && (
            <p className="text-[11px] text-gray-400">No versions yet.</p>
          )}
          {versions.map((v, idx) => (
            <div
              key={v.id}
              className="rounded-md border border-gray-100 bg-gray-50 px-2.5 py-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium">
                  v{v.versionNumber}
                  {idx === 0 && (
                    <span className="ml-1 text-[10px] font-normal text-green-600">
                      current
                    </span>
                  )}
                </span>
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => restore(v.versionNumber)}
                    disabled={restoring !== null}
                    className={cn(
                      "flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-900",
                      restoring === v.versionNumber && "opacity-50"
                    )}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore
                  </button>
                )}
              </div>
              <div className="text-[10px] text-gray-400">
                {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
              </div>
              {v.changeNote && (
                <div className="mt-0.5 text-[10px] text-gray-500">
                  {v.changeNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
