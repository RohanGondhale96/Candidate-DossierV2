"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { useResumeStore } from "@/stores/resumeStore";
import { AVAILABLE_TEMPLATES } from "@/types/resume";

export function TemplateSelector() {
  const templateId = useResumeStore((s) => s.templateId);
  const setTemplate = useResumeStore((s) => s.setTemplate);
  const accentColor = useResumeStore((s) => s.accentColor);

  return (
    <div className="grid grid-cols-2 gap-2">
      {AVAILABLE_TEMPLATES.map((t) => {
        const active = t.id === templateId;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTemplate(t.id)}
            className={cn(
              "group relative rounded-md border p-2 text-left transition-all hover:border-gray-400",
              active ? "border-transparent ring-2" : "border-gray-200"
            )}
            style={active ? { ["--tw-ring-color" as string]: accentColor } : undefined}
            title={t.description}
          >
            {/* Mini preview — reflects each template's real header style */}
            <div className="mb-1.5 aspect-[3/4] overflow-hidden rounded-sm border border-gray-100 bg-white">
              {t.id === "modern" ? (
                <div className="flex items-center gap-1 p-1.5">
                  <div
                    className="h-6 w-1 shrink-0 rounded"
                    style={{ backgroundColor: accentColor }}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 w-2/3 rounded bg-gray-300" />
                    <div className="h-1 w-1/2 rounded bg-gray-200" />
                  </div>
                </div>
              ) : t.id === "minimal" ? (
                <div className="px-1.5 pt-3">
                  <div className="h-1.5 w-2/3 rounded bg-gray-300" />
                  <div
                    className="mt-1.5 h-px w-full"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>
              ) : (
                <div
                  className={t.id === "compact" ? "h-[18%] w-full" : "h-1/4 w-full"}
                  style={{ backgroundColor: accentColor }}
                />
              )}
              <div
                className={
                  t.id === "compact" ? "space-y-0.5 p-1.5" : "space-y-1 p-1.5"
                }
              >
                <div className="h-1 w-3/4 rounded bg-gray-200" />
                <div className="h-1 w-1/2 rounded bg-gray-200" />
                <div className="h-1 w-2/3 rounded bg-gray-100" />
                {t.id === "compact" && (
                  <div className="h-1 w-3/5 rounded bg-gray-100" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium">{t.name}</span>
              {active && (
                <Check className="h-3 w-3" style={{ color: accentColor }} />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
