"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

import { useResumeStore } from "@/stores/resumeStore";
import type { RecruiterNoteData } from "@/types/resume";
import { cn } from "@/lib/utils";

function stripHtml(str: string): string {
  return str
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function RecruiterNoteSection({
  sectionId,
  data,
  editable,
}: {
  sectionId: string;
  data: RecruiterNoteData;
  editable: boolean;
}) {
  const update = useResumeStore((s) => s.updateSectionData);
  const [value, setValue] = useState(() => stripHtml(data.content ?? ""));
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isFocused = useRef(false);

  const grow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => { grow(); }, [value, grow]);

  // Sync when content is replaced externally (version restore, etc.)
  useEffect(() => {
    if (isFocused.current) return;
    const clean = stripHtml(data.content ?? "");
    setValue(clean);
  }, [data.content]);

  if (!editable) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="mb-2 flex items-center gap-1.5">
          <Pencil className="h-3 w-3 text-gray-400" aria-hidden="true" />
          <span className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
            Recruiter note
          </span>
        </div>
        <p className="whitespace-pre-wrap text-[13px] italic leading-relaxed text-gray-600">
          {value}
        </p>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={-1}
      className={cn(
        "group cursor-text rounded-lg border-2 border-dashed px-4 py-3 transition-all duration-150",
        focused
          ? "border-[#0076FB] bg-blue-50/40"
          : "border-gray-300 bg-white hover:border-[#0076FB]/50 hover:bg-blue-50/20"
      )}
      onClick={() => textareaRef.current?.focus()}
      onKeyDown={(e) => e.key === "Enter" && textareaRef.current?.focus()}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Pencil
            className={cn(
              "h-3 w-3 transition-colors",
              focused ? "text-[#0076FB]" : "text-gray-400 group-hover:text-[#0076FB]"
            )}
            aria-hidden="true"
          />
          <span
            className={cn(
              "text-[11px] font-medium uppercase tracking-widest transition-colors",
              focused ? "text-[#0076FB]" : "text-gray-400 group-hover:text-[#0076FB]"
            )}
          >
            Recruiter note
          </span>
        </div>
        {!value && !focused && (
          <span className="text-[11px] italic text-gray-400">
            Click to type…
          </span>
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        rows={2}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => { isFocused.current = true; setFocused(true); }}
        onBlur={() => {
          isFocused.current = false;
          setFocused(false);
          update(sectionId, { content: value });
        }}
        placeholder="Add a note about why this candidate is a great fit…"
        className="w-full resize-none bg-transparent text-[13px] italic leading-relaxed text-gray-700 placeholder:not-italic placeholder:text-gray-400 focus:outline-none"
        style={{ overflow: "hidden" }}
      />
    </div>
  );
}
