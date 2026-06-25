"use client";

import { v4 as uuidv4 } from "uuid";
import { X, Plus } from "lucide-react";

import { useResumeStore } from "@/stores/resumeStore";
import type { CertificationsData, CertificationEntry } from "@/types/resume";
import type { ResumeTheme } from "../templates/theme";
import { InlineEditor } from "../InlineEditor";
import { SectionTitle } from "./SectionTitle";

export function CertificationsSection({
  sectionId,
  data,
  theme,
  accentColor,
  editable,
}: {
  sectionId: string;
  data: CertificationsData;
  theme: ResumeTheme;
  accentColor: string;
  editable: boolean;
}) {
  const update = useResumeStore((s) => s.updateSectionData);
  const entries = data.entries ?? [];

  function updateEntry(id: string, partial: Partial<CertificationEntry>) {
    update(sectionId, {
      entries: entries.map((e) => (e.id === id ? { ...e, ...partial } : e)),
    });
  }
  function removeEntry(id: string) {
    update(sectionId, { entries: entries.filter((e) => e.id !== id) });
  }
  function addEntry() {
    update(sectionId, {
      entries: [
        ...entries,
        { id: uuidv4(), name: "", issuer: "", dateObtained: "" },
      ],
    });
  }

  return (
    <section>
      <SectionTitle theme={theme} accentColor={accentColor}>
        Certifications
      </SectionTitle>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="group/cert relative flex flex-wrap items-baseline gap-x-1 text-[13px]"
          >
            {editable && (
              <button
                type="button"
                onClick={() => removeEntry(entry.id)}
                className="absolute -left-5 top-0.5 opacity-0 transition-opacity group-hover/cert:opacity-100"
                aria-label="Remove certification"
              >
                <X className="h-3.5 w-3.5 text-gray-400 hover:text-destructive" />
              </button>
            )}
            <span className="font-semibold text-gray-900">
              <InlineEditor
                content={entry.name}
                multiline={false}
                editable={editable}
                placeholder="Certification"
                onChange={(v) => updateEntry(entry.id, { name: v })}
              />
            </span>
            <span className="text-gray-400">—</span>
            <span className="text-gray-600">
              <InlineEditor
                content={entry.issuer}
                multiline={false}
                editable={editable}
                placeholder="Issuer"
                onChange={(v) => updateEntry(entry.id, { issuer: v })}
              />
            </span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500">
              <InlineEditor
                content={entry.dateObtained ?? ""}
                multiline={false}
                editable={editable}
                placeholder="Date"
                onChange={(v) => updateEntry(entry.id, { dateObtained: v })}
              />
            </span>
          </div>
        ))}

        {editable && (
          <button
            type="button"
            onClick={addEntry}
            className="inline-flex items-center gap-1 text-[12px] text-gray-400 transition-colors hover:text-gray-600"
          >
            <Plus className="h-3.5 w-3.5" /> Add Certification
          </button>
        )}
      </div>
    </section>
  );
}
