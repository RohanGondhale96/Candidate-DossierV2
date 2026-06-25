"use client";

import { useResumeStore } from "@/stores/resumeStore";
import { FONT_OPTIONS } from "@/types/resume";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Sentinel value for the "use the template's default font" option. Radix Select
// items cannot have an empty-string value, so we map "" <-> this token.
const DEFAULT_VALUE = "__default__";

export function FontPicker() {
  const fontFamily = useResumeStore((s) => s.fontFamily);
  const setFontFamily = useResumeStore((s) => s.setFontFamily);

  return (
    <Select
      value={fontFamily === "" ? DEFAULT_VALUE : fontFamily}
      onValueChange={(value) =>
        setFontFamily(value === DEFAULT_VALUE ? "" : value)
      }
    >
      <SelectTrigger className="h-9 text-sm">
        <SelectValue placeholder="Template default" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={DEFAULT_VALUE}>Template default</SelectItem>
        {FONT_OPTIONS.map((font) => (
          <SelectItem
            key={font.id}
            value={font.id}
            style={{ fontFamily: font.stack }}
          >
            {font.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
