"use client";

import { Sparkles, ChevronRight, Send } from "lucide-react";

import { cn } from "@/lib/utils";

export function AIAssistantPanel({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden border-l bg-white transition-[width] duration-200 ease-in-out",
        collapsed ? "w-10" : "w-[260px]"
      )}
    >
      {collapsed ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex h-full w-10 flex-col items-center gap-2 py-3 transition-colors hover:bg-gray-50"
          aria-label="Expand AI assistant"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span
            className="text-[11px] font-medium text-gray-500"
            style={{ writingMode: "vertical-rl" }}
          >
            AI
          </span>
        </button>
      ) : (
        <div className="flex h-full w-[260px] flex-col">
          <div className="flex h-12 items-center justify-between border-b px-3">
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              AI Assistant
            </span>
            <button
              type="button"
              onClick={onToggle}
              className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Collapse AI assistant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium">Coming in Phase 2</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-500">
                AI-powered suggestions, content generation, and live resume
                scoring are coming soon. The assistant will help you:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-gray-500">
                <li>• Get suggestions to improve the resume</li>
                <li>• Generate missing sections automatically</li>
                <li>• Rewrite content for better impact</li>
                <li>• See live job match and quality scores</li>
              </ul>
            </div>
          </div>

          <div className="border-t p-3">
            <div className="flex items-center gap-2 rounded-md border bg-gray-50 px-3 py-2 opacity-60">
              <input
                disabled
                placeholder="Ask AI to improve..."
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-gray-400"
              />
              <Send className="h-3.5 w-3.5 text-gray-400" />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
