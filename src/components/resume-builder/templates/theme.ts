// Per-template style tokens. All templates share the same inline-editing
// section components; the template only changes typography, spacing, header
// treatment, and how the accent color is applied.

export type HeaderVariant = "banner" | "sidebar" | "compact" | "plain";

export interface ResumeTheme {
  templateId: string;
  /** Page container classes (font family, base text size — no padding). */
  pageClass: string;
  /** Padding for the body area below the header. */
  bodyPadClass: string;
  /** Vertical gap between sections. */
  sectionGapClass: string;
  /** Section title classes (color applied separately via accent). */
  sectionTitleClass: string;
  /** Whether section titles get an accent bottom border. */
  sectionTitleBorder: boolean;
  /** How the header section renders. */
  headerVariant: HeaderVariant;
  /** Body layout: single column, or sidebar + main. */
  layout: "single" | "two-column";
}

const THEMES: Record<string, Omit<ResumeTheme, "templateId">> = {
  classic: {
    pageClass: "font-serif text-[14px] leading-relaxed text-gray-800",
    bodyPadClass: "px-10 pb-10 pt-6",
    sectionGapClass: "space-y-6",
    sectionTitleClass:
      "text-[13px] font-semibold uppercase tracking-wider pb-1 mb-2",
    sectionTitleBorder: true,
    headerVariant: "banner",
    layout: "single",
  },
  modern: {
    pageClass: "font-sans text-[14px] leading-relaxed text-gray-800",
    bodyPadClass: "px-10 pb-10 pt-6",
    sectionGapClass: "space-y-6",
    sectionTitleClass: "text-[15px] font-bold tracking-tight mb-2",
    sectionTitleBorder: false,
    headerVariant: "sidebar",
    layout: "two-column",
  },
  compact: {
    pageClass: "font-sans text-[12.5px] leading-snug text-gray-800",
    bodyPadClass: "px-8 pb-8 pt-5",
    sectionGapClass: "space-y-4",
    sectionTitleClass:
      "text-[12px] font-bold uppercase tracking-wide pb-0.5 mb-1.5",
    sectionTitleBorder: true,
    headerVariant: "compact",
    layout: "single",
  },
  minimal: {
    pageClass: "font-sans font-light text-[14px] leading-relaxed text-gray-700",
    bodyPadClass: "px-14 pb-14 pt-8",
    sectionGapClass: "space-y-9",
    sectionTitleClass:
      "text-[11px] font-medium uppercase tracking-[0.2em] text-gray-400 mb-3",
    sectionTitleBorder: false,
    headerVariant: "plain",
    layout: "single",
  },
};

export function getTheme(templateId: string): ResumeTheme {
  const base = THEMES[templateId] ?? THEMES.classic;
  return { templateId, ...base };
}
