"use client";

import { useResumeStore } from "@/stores/resumeStore";
import type { SummaryData } from "@/types/resume";
import type { ResumeTheme } from "../templates/theme";
import { InlineEditor } from "../InlineEditor";
import { SectionTitle } from "./SectionTitle";

export function SummarySection({
  sectionId,
  data,
  theme,
  accentColor,
  editable,
}: {
  sectionId: string;
  data: SummaryData;
  theme: ResumeTheme;
  accentColor: string;
  editable: boolean;
}) {
  const update = useResumeStore((s) => s.updateSectionData);
  return (
    <section>
      <SectionTitle theme={theme} accentColor={accentColor}>
        Summary
      </SectionTitle>
      <InlineEditor
        content={data.content}
        editable={editable}
        placeholder="Professional summary..."
        onChange={(v) => update(sectionId, { content: v })}
      />
    </section>
  );
}
