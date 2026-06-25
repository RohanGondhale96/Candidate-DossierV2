"use client";

import { v4 as uuidv4 } from "uuid";
import { X, Plus } from "lucide-react";

import { useResumeStore } from "@/stores/resumeStore";
import type { ExperienceData, ExperienceEntry } from "@/types/resume";
import type { ResumeTheme } from "../templates/theme";
import { InlineEditor } from "../InlineEditor";
import { SectionTitle } from "./SectionTitle";

export function ExperienceSection({
  sectionId,
  data,
  theme,
  accentColor,
  editable,
}: {
  sectionId: string;
  data: ExperienceData;
  theme: ResumeTheme;
  accentColor: string;
  editable: boolean;
}) {
  const update = useResumeStore((s) => s.updateSectionData);
  const entries = data.entries ?? [];

  function updateEntry(id: string, partial: Partial<ExperienceEntry>) {
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
          company: "",
          title: "",
          location: "",
          startDate: "",
          endDate: null,
          description: "",
        },
      ],
    });
  }

  return (
    <section>
      <SectionTitle theme={theme} accentColor={accentColor}>
        Experience
      </SectionTitle>
      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="group/exp relative">
            {editable && (
              <button
                type="button"
                onClick={() => removeEntry(entry.id)}
                className="absolute -left-5 top-0.5 opacity-0 transition-opacity group-hover/exp:opacity-100"
                aria-label="Remove experience"
              >
                <X className="h-3.5 w-3.5 text-gray-400 hover:text-destructive" />
              </button>
            )}
            <div className="flex items-baseline justify-between gap-3">
              <InlineEditor
                content={entry.title}
                multiline={false}
                editable={editable}
                placeholder="Job Title"
                className="text-[14px] font-semibold text-gray-900"
                onChange={(v) => updateEntry(entry.id, { title: v })}
              />
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
                  content={entry.endDate ?? "Present"}
                  multiline={false}
                  editable={editable}
                  placeholder="End"
                  onChange={(v) =>
                    updateEntry(entry.id, {
                      endDate: v.trim().toLowerCase() === "present" ? null : v,
                    })
                  }
                />
              </div>
            </div>
            <div
              className="text-[13px] font-medium"
              style={{ color: accentColor }}
            >
              <span className="flex flex-wrap items-baseline gap-x-1">
                <InlineEditor
                  content={entry.company}
                  multiline={false}
                  editable={editable}
                  placeholder="Company"
                  onChange={(v) => updateEntry(entry.id, { company: v })}
                />
                <span className="text-gray-400">·</span>
                <span className="text-gray-500">
                  <InlineEditor
                    content={entry.location ?? ""}
                    multiline={false}
                    editable={editable}
                    placeholder="Location"
                    onChange={(v) => updateEntry(entry.id, { location: v })}
                  />
                </span>
              </span>
            </div>
            <div className="mt-1 text-[13px] text-gray-700">
              <InlineEditor
                content={entry.description}
                editable={editable}
                placeholder="Describe responsibilities and achievements..."
                onChange={(v) => updateEntry(entry.id, { description: v })}
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
            <Plus className="h-3.5 w-3.5" /> Add Experience
          </button>
        )}
      </div>
    </section>
  );
}
