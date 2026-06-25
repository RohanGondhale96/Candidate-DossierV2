"use client";

import { useResumeStore } from "@/stores/resumeStore";
import type { CustomSectionData } from "@/types/resume";
import type { ResumeTheme } from "../templates/theme";
import { InlineEditor } from "../InlineEditor";
import { SectionTitle } from "./SectionTitle";

export function CustomSection({
  sectionId,
  data,
  theme,
  accentColor,
  editable,
}: {
  sectionId: string;
  data: CustomSectionData;
  theme: ResumeTheme;
  accentColor: string;
  editable: boolean;
}) {
  const update = useResumeStore((s) => s.updateSectionData);
  return (
    <section>
      <SectionTitle theme={theme} accentColor={accentColor}>
        <InlineEditor
          content={data.title}
          multiline={false}
          editable={editable}
          placeholder="Section Title"
          onChange={(v) => update(sectionId, { title: v })}
        />
      </SectionTitle>
      <InlineEditor
        content={data.content}
        editable={editable}
        placeholder="Add content..."
        onChange={(v) => update(sectionId, { content: v })}
      />
    </section>
  );
}
