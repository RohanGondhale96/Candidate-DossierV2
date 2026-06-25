"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

export function SectionWrapper({
  sectionId,
  editable,
  hidden,
  onDelete,
  onToggleVisibility,
  children,
}: {
  sectionId: string;
  editable: boolean;
  hidden: boolean;
  onDelete: () => void;
  onToggleVisibility: () => void;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sectionId, disabled: !editable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/section relative rounded-md transition-shadow",
        isDragging && "z-10 bg-white opacity-80 shadow-lg ring-1 ring-gray-200",
        // Hidden sections are shown dimmed in the editor but never printed.
        hidden && "print:hidden"
      )}
    >
      {editable && (
        <>
          {/* Drag handle — visible on hover */}
          <button
            type="button"
            className="absolute -left-7 top-0 flex h-6 w-6 cursor-grab items-center justify-center rounded text-gray-300 opacity-0 transition-opacity hover:text-gray-500 group-hover/section:opacity-100 active:cursor-grabbing"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Right-side controls: show/hide + delete.
              Always visible when hidden so the section can be restored. */}
          <div
            className={cn(
              "absolute -right-7 top-0 flex flex-col gap-1 transition-opacity",
              hidden ? "opacity-100" : "opacity-0 group-hover/section:opacity-100"
            )}
          >
            <button
              type="button"
              onClick={onToggleVisibility}
              className="flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:text-gray-600"
              aria-label={hidden ? "Show section" : "Hide section"}
              title={hidden ? "Show on resume" : "Hide from resume"}
            >
              {hidden ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="flex h-6 w-6 items-center justify-center rounded text-gray-300 transition-colors hover:text-destructive"
              aria-label="Delete section"
              title="Delete section"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </>
      )}

      {/* Hidden sections stay in the editor (dimmed) so they can be restored;
          they are omitted entirely from print/export and read-only views. */}
      {editable && hidden && (
        <div className="mb-1 inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
          <EyeOff className="h-3 w-3" /> Hidden — won&apos;t appear on the resume
        </div>
      )}
      <div className={cn(hidden && editable && "opacity-40")}>{children}</div>
    </div>
  );
}
