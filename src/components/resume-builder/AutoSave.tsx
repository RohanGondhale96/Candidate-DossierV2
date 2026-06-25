"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Loader2, CircleDot } from "lucide-react";

import { useResumeStore } from "@/stores/resumeStore";

const AUTOSAVE_DELAY = 30_000;

/** Headless component that debounces auto-save 30s after the last edit. */
export function AutoSave() {
  const isDirty = useResumeStore((s) => s.isDirty);
  const content = useResumeStore((s) => s.content);
  const templateId = useResumeStore((s) => s.templateId);
  const accentColor = useResumeStore((s) => s.accentColor);
  const logoUrl = useResumeStore((s) => s.logoUrl);
  const saveResume = useResumeStore((s) => s.saveResume);

  // Debounced auto-save: timer resets whenever the resume changes.
  useEffect(() => {
    if (!isDirty) return;
    const t = setTimeout(() => {
      void saveResume();
    }, AUTOSAVE_DELAY);
    return () => clearTimeout(t);
  }, [isDirty, content, templateId, accentColor, logoUrl, saveResume]);

  // Best-effort save when leaving the page.
  useEffect(() => {
    const handler = () => {
      if (useResumeStore.getState().isDirty) void saveResume();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saveResume]);

  return null;
}

/** Visual save status for the top bar. */
export function AutoSaveIndicator() {
  const isDirty = useResumeStore((s) => s.isDirty);
  const isSaving = useResumeStore((s) => s.isSaving);
  const lastSavedAt = useResumeStore((s) => s.lastSavedAt);

  // Tick to keep the relative time fresh.
  const [, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(i);
  }, []);

  if (isSaving) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-gray-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Saving…
      </span>
    );
  }
  if (isDirty) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-600">
        <CircleDot className="h-3.5 w-3.5" />
        Unsaved changes
      </span>
    );
  }
  if (lastSavedAt) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-green-600">
        <Check className="h-3.5 w-3.5" />
        Saved {formatDistanceToNow(lastSavedAt, { addSuffix: true })}
      </span>
    );
  }
  return <span className="text-xs text-gray-400">Not saved yet</span>;
}
