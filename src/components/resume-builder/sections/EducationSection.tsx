"use client";

import { v4 as uuidv4 } from "uuid";
import { X, Plus } from "lucide-react";

import { useResumeStore } from "@/stores/resumeStore";
import type { EducationData, EducationEntry } from "@/types/resume";
import type { ResumeTheme } from "../templates/theme";
import { InlineEditor } from "../InlineEditor";
import { SectionTitle } from "./SectionTitle";

export function EducationSection({
  sectionId,
  data,
  theme,
  accentColor,
  editable,
}: {
  sectionId: string;
  data: EducationData;
  theme: ResumeTheme;
  accentColor: string;
  editable: boolean;
}) {
  const update = useResumeStore((s) => s.updateSectionData);
  const entries = data.entries ?? [];

  function updateEntry(id: string, partial: Partial<EducationEntry>) {
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
        {
          id: uuidv4(),
          institution: "",
          degree: "",
          field: "",
          startDate: "",
          endDate: "",
        },
      ],
    });
  }

  return (
    <section>
      <SectionTitle theme={theme} accentColor={accentColor}>
        Education
      </SectionTitle>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="group/edu relative">
            {editable && (
              <button
                type="button"
                onClick={() => removeEntry(entry.id)}
                className="absolute -left-5 top-0.5 opacity-0 transition-opacity group-hover/edu:opacity-100"
                aria-label="Remove education"
              >
                <X className="h-3.5 w-3.5 text-gray-400 hover:text-destructive" />
              </button>
            )}
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex flex-wrap items-baseline gap-x-1 text-[14px] font-semibold text-gray-900">
                <InlineEditor
                  content={entry.degree}
                  multiline={false}
                  editable={editable}
                  placeholder="Degree"
                  onChange={(v) => updateEntry(entry.id, { degree: v })}
                />
                <span className="text-gray-400">,</span>
                <span className="font-normal text-gray-600">
                  <InlineEditor
                    content={entry.field}
                    multiline={false}
                    editable={editable}
                    placeholder="Field of study"
                    onChange={(v) => updateEntry(entry.id, { field: v })}
                  />
                </span>
              </div>
              <div className="flex shrink-0 items-baseline gap-1 text-[12px] text-gray-500">
                <InlineEditor
                  content={entry.startDate}
                  multiline={false}
                  editable={editable}
                  placeholder="Start"
                  onChange={(v) => updateEntry(entry.id, { startDate: v })}
                />
                <span>—</span>
                <InlineEditor
                  content={entry.endDate ?? ""}
                  multiline={false}
                  editable={editable}
                  placeholder="End"
                  onChange={(v) => updateEntry(entry.id, { endDate: v })}
                />
              </div>
            </div>
            <div
              className="text-[13px] font-medium"
              style={{ color: accentColor }}
            >
              <InlineEditor
                content={entry.institution}
                multiline={false}
                editable={editable}
                placeholder="Institution"
                onChange={(v) => updateEntry(entry.id, { institution: v })}
              />
            </div>
          </div>
        ))}

        {editable && (
          <button
            type="button"
            onClick={addEntry}
            className="inline-flex items-center gap-1 text-[12px] text-gray-400 transition-colors hover:text-gray-600"
          >
            <Plus className="h-3.5 w-3.5" /> Add Education
          </button>
        )}
      </div>
    </section>
  );
}
