"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { X, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { useResumeStore } from "@/stores/resumeStore";
import type { SkillsData } from "@/types/resume";
import type { ResumeTheme } from "../templates/theme";
import { SectionTitle } from "./SectionTitle";

function ratingColor(r: number): string {
  if (r >= 4) return "#1D9E75"; // green
  if (r >= 2.5) return "#D9A21B"; // amber
  return "#D85A30"; // red
}

function fmtRating(r: number): string {
  return Number.isInteger(r) ? `${r}` : r.toFixed(1);
}

export function SkillsSection({
  sectionId,
  data,
  theme,
  accentColor,
  editable,
}: {
  sectionId: string;
  data: SkillsData;
  theme: ResumeTheme;
  accentColor: string;
  editable: boolean;
}) {
  const update = useResumeStore((s) => s.updateSectionData);
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");
  const [newRating, setNewRating] = useState(3);

  const skills = data.skills ?? [];
  // Narrow sidebar (Modern) → single column; otherwise two columns.
  const colsClass =
    theme.layout === "two-column" ? "grid-cols-1" : "grid-cols-2";

  function addSkill() {
    const name = value.trim();
    if (!name) return;
    update(sectionId, {
      skills: [...skills, { id: uuidv4(), name, rating: newRating }],
    });
    setValue("");
    setNewRating(3);
  }

  function cancelAdd() {
    setValue("");
    setNewRating(3);
    setAdding(false);
  }

  function removeSkill(id: string) {
    update(sectionId, { skills: skills.filter((s) => s.id !== id) });
  }

  return (
    <section>
      <SectionTitle theme={theme} accentColor={accentColor}>
        Assessed Skills{" "}
        <span className="font-normal opacity-60">({skills.length})</span>
      </SectionTitle>

      <div className={cn("grid gap-x-6 gap-y-3", colsClass)}>
        {skills.map((skill) => {
          const rating = skill.rating ?? 3;
          const color = ratingColor(rating);
          return (
            <div key={skill.id} className="group min-w-0">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-[12px] font-medium text-gray-700">
                  {skill.name}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <span
                    className="text-[12px] font-semibold tabular-nums"
                    style={{ color }}
                  >
                    {fmtRating(rating)}
                  </span>
                  <span className="text-[11px] text-gray-400">/5</span>
                  {editable && (
                    <button
                      type="button"
                      onClick={() => removeSkill(skill.id)}
                      aria-label={`Remove ${skill.name}`}
                      className="ml-0.5 text-gray-300 opacity-0 transition-opacity hover:text-gray-600 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(Math.max(0, Math.min(5, rating)) / 5) * 100}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {editable && (
        <div className="mt-3">
          {adding ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  } else if (e.key === "Escape") {
                    cancelAdd();
                  }
                }}
                placeholder="Skill name"
                className="rounded-md border border-dashed border-gray-300 px-2.5 py-1 text-[12px] outline-none focus:border-gray-400"
              />
              <label className="flex items-center gap-1 text-[12px] text-gray-500">
                Rating
                <select
                  value={newRating}
                  onChange={(e) => setNewRating(Number(e.target.value))}
                  className="rounded-md border border-gray-300 bg-white px-1.5 py-1 text-[12px] outline-none focus:border-gray-400"
                >
                  {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((r) => (
                    <option key={r} value={r}>
                      {fmtRating(r)}/5
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={addSkill}
                disabled={!value.trim()}
                className="rounded-md bg-primary px-2.5 py-1 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={cancelAdd}
                className="text-[12px] text-gray-400 transition-colors hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1 text-[12px] text-gray-400 transition-colors hover:text-gray-600"
            >
              <Plus className="h-3 w-3" /> Add Skill
            </button>
          )}
        </div>
      )}
    </section>
  );
}
