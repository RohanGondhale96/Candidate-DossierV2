"use client";

import { Plus } from "lucide-react";

import { useResumeStore } from "@/stores/resumeStore";
import type { ResumeSectionType } from "@/types/resume";
import { SECTION_TITLES } from "@/types/resume";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Sections offered by "Add Section". Singletons are hidden once present;
// "custom" can be added any number of times.
const ADDABLE: ResumeSectionType[] = [
  "summary",
  "recruiter_note",
  "skills",
  "experience",
  "education",
  "certifications",
  "custom",
];

export function AddSectionMenu() {
  const sections = useResumeStore((s) => s.content.sections);
  const addSection = useResumeStore((s) => s.addSection);

  const existing = new Set(sections.map((s) => s.type));
  const options = ADDABLE.filter(
    (t) => t === "custom" || !existing.has(t)
  );

  if (options.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-[13px] text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Plus className="h-4 w-4" /> Add Section
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        {options.map((type) => (
          <DropdownMenuItem key={type} onClick={() => addSection(type)}>
            {SECTION_TITLES[type]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
