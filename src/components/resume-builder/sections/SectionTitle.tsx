import { cn } from "@/lib/utils";
import type { ResumeTheme } from "../templates/theme";

export function SectionTitle({
  theme,
  accentColor,
  children,
}: {
  theme: ResumeTheme;
  accentColor: string;
  children: React.ReactNode;
}) {
  const usesAccent = theme.templateId !== "minimal";
  return (
    <h2
      className={cn(theme.sectionTitleClass)}
      style={{
        color: usesAccent ? accentColor : undefined,
        borderBottom: theme.sectionTitleBorder
          ? `1.5px solid ${accentColor}`
          : undefined,
      }}
    >
      {children}
    </h2>
  );
}
