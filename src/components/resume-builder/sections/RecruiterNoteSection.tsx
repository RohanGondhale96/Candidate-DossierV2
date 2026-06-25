"use client";

import { useResumeStore } from "@/stores/resumeStore";
import type { RecruiterNoteData } from "@/types/resume";
import type { ResumeTheme } from "../templates/theme";
import { InlineEditor } from "../InlineEditor";
import { SectionTitle } from "./SectionTitle";
import { hexToRgba } from "@/lib/color";

export function RecruiterNoteSection({
  sectionId,
  data,
  theme,
  accentColor,
  editable,
}: {
  sectionId: string;
  data: RecruiterNoteData;
  theme: ResumeTheme;
  accentColor: string;
  editable: boolean;
}) {
  const update = useResumeStore((s) => s.updateSectionData);
  return (
    <section>
      <SectionTitle theme={theme} accentColor={accentColor}>
        Recruiter Note
      </SectionTitle>
      <div
        className="rounded-md px-4 py-3"
        style={{
          backgroundColor: hexToRgba(accentColor, 0.07),
          borderLeft: `3px solid ${accentColor}`,
        }}
      >
        <InlineEditor
          content={data.content}
          editable={editable}
          placeholder="Add notes about why this candidate is a fit for the role..."
          onChange={(v) => update(sectionId, { content: v })}
        />
      </div>
    </section>
  );
}
