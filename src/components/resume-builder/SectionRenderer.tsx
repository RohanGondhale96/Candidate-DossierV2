"use client";

import type { ResumeSection } from "@/types/resume";
import type {
  RecruiterNoteData,
  SummaryData,
  SkillsData,
  ExperienceData,
  EducationData,
  CertificationsData,
  CustomSectionData,
} from "@/types/resume";
import type { ResumeTheme } from "./templates/theme";

import { RecruiterNoteSection } from "./sections/RecruiterNoteSection";
import { SummarySection } from "./sections/SummarySection";
import { SkillsSection } from "./sections/SkillsSection";
import { ExperienceSection } from "./sections/ExperienceSection";
import { EducationSection } from "./sections/EducationSection";
import { CertificationsSection } from "./sections/CertificationsSection";
import { CustomSection } from "./sections/CustomSection";

export function SectionRenderer({
  section,
  theme,
  accentColor,
  editable,
}: {
  section: ResumeSection;
  theme: ResumeTheme;
  accentColor: string;
  editable: boolean;
}) {
  const common = { sectionId: section.id, theme, accentColor, editable };

  switch (section.type) {
    case "recruiter_note":
      return (
        <RecruiterNoteSection {...common} data={section.data as RecruiterNoteData} />
      );
    case "summary":
      return <SummarySection {...common} data={section.data as SummaryData} />;
    case "skills":
      return <SkillsSection {...common} data={section.data as SkillsData} />;
    case "experience":
      return (
        <ExperienceSection {...common} data={section.data as ExperienceData} />
      );
    case "education":
      return <EducationSection {...common} data={section.data as EducationData} />;
    case "certifications":
      return (
        <CertificationsSection
          {...common}
          data={section.data as CertificationsData}
        />
      );
    case "custom":
      return <CustomSection {...common} data={section.data as CustomSectionData} />;
    default:
      return null;
  }
}
