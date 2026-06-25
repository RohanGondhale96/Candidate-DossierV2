"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { useResumeStore } from "@/stores/resumeStore";
import { ACCENT_COLORS } from "@/types/resume";

export function ColorPicker() {
  const accentColor = useResumeStore((s) => s.accentColor);
  const setAccentColor = useResumeStore((s) => s.setAccentColor);

  return (
    <div className="flex flex-wrap gap-2">
      {ACCENT_COLORS.map((color) => {
        const active = color.toLowerCase() === accentColor.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            onClick={() => setAccentColor(color)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110",
              active && "ring-2 ring-offset-2"
            )}
            style={{
              backgroundColor: color,
              ["--tw-ring-color" as string]: color,
            }}
            aria-label={`Accent color ${color}`}
          >
            {active && <Check className="h-3.5 w-3.5 text-white" />}
          </button>
        );
      })}
    </div>
  );
}
