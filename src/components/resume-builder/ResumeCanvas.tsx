"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { cn } from "@/lib/utils";
import { hexToRgba } from "@/lib/color";
import { useResumeStore } from "@/stores/resumeStore";
import type { HeaderData, ResumeSection, ResumeSectionType } from "@/types/resume";
import { fontStack } from "@/types/resume";
import { getTheme } from "./templates/theme";
import { HeaderSection } from "./sections/HeaderSection";
import { SectionRenderer } from "./SectionRenderer";
import { SectionWrapper } from "./SectionWrapper";
import { AddSectionMenu } from "./AddSectionMenu";

// For the two-column (Modern) layout: which sections go in the sidebar vs main.
const SIDEBAR_TYPES: ResumeSectionType[] = [
  "skills",
  "education",
  "certifications",
];

export function ResumeCanvas({ editable = true }: { editable?: boolean }) {
  const sections = useResumeStore((s) => s.content.sections);
  const templateId = useResumeStore((s) => s.templateId);
  const accentColor = useResumeStore((s) => s.accentColor);
  const fontFamily = useResumeStore((s) => s.fontFamily);
  const logoUrl = useResumeStore((s) => s.logoUrl);
  const logoHidden = useResumeStore((s) => s.logoHidden);
  const reorderSections = useResumeStore((s) => s.reorderSections);
  const removeSection = useResumeStore((s) => s.removeSection);
  const toggleSectionVisibility = useResumeStore(
    (s) => s.toggleSectionVisibility
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const theme = getTheme(templateId);
  const twoCol = theme.layout === "two-column";
  const header = sections.find((s) => s.type === "header");
  // In the editor, keep hidden sections visible (dimmed) so they can be
  // restored; everywhere else (print/export, client view) omit them.
  const bodySections = sections.filter(
    (s) => s.type !== "header" && (editable || s.visible)
  );

  const isSidebar = (t: ResumeSectionType) => SIDEBAR_TYPES.includes(t);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeSec = sections.find((s) => s.id === active.id);
    const overSec = sections.find((s) => s.id === over.id);
    if (!activeSec || !overSec) return;
    // In two-column mode, reordering is only allowed within the same column.
    if (twoCol && isSidebar(activeSec.type) !== isSidebar(overSec.type)) return;
    const from = sections.findIndex((s) => s.id === active.id);
    const to = sections.findIndex((s) => s.id === over.id);
    if (from !== -1 && to !== -1) reorderSections(from, to);
  }

  const renderItem = (section: ResumeSection) => (
    <SectionWrapper
      key={section.id}
      sectionId={section.id}
      editable={editable}
      hidden={!section.visible}
      onDelete={() => removeSection(section.id)}
      onToggleVisibility={() => toggleSectionVisibility(section.id)}
    >
      <SectionRenderer
        section={section}
        theme={theme}
        accentColor={accentColor}
        editable={editable}
      />
    </SectionWrapper>
  );

  const sortableList = (items: ResumeSection[]) => (
    <SortableContext
      items={items.map((s) => s.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className={cn(theme.sectionGapClass)}>{items.map(renderItem)}</div>
    </SortableContext>
  );

  return (
    <div className="flex justify-center p-8">
      <div
        className={cn("resume-page print-area", theme.pageClass)}
        style={{
          ["--accent-color" as string]: accentColor,
          // Inline style overrides the template's font-* class. Leave unset for
          // the "" (default) option so the template's own typeface applies.
          fontFamily: fontStack(fontFamily),
        }}
      >
        {header && (
          <HeaderSection
            sectionId={header.id}
            data={header.data as HeaderData}
            theme={theme}
            accentColor={accentColor}
            editable={editable}
            logoUrl={logoUrl}
            logoHidden={logoHidden}
          />
        )}

        <div className={cn(theme.bodyPadClass)}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {twoCol ? (
              <TwoColumn
                accentColor={accentColor}
                sidebar={bodySections.filter((s) => isSidebar(s.type))}
                main={bodySections.filter((s) => !isSidebar(s.type))}
                renderList={sortableList}
              />
            ) : (
              sortableList(bodySections)
            )}
          </DndContext>

          {editable && (
            <div className="no-print pt-3">
              <AddSectionMenu />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TwoColumn({
  accentColor,
  sidebar,
  main,
  renderList,
}: {
  accentColor: string;
  sidebar: ResumeSection[];
  main: ResumeSection[];
  renderList: (items: ResumeSection[]) => React.ReactNode;
}) {
  return (
    <div className="flex gap-6">
      <aside
        className="w-[34%] shrink-0 rounded-lg p-4"
        style={{ backgroundColor: hexToRgba(accentColor, 0.05) }}
      >
        {renderList(sidebar)}
      </aside>
      <div className="min-w-0 flex-1">{renderList(main)}</div>
    </div>
  );
}
