"use client";

import { Mail, Phone, MapPin, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useResumeStore } from "@/stores/resumeStore";
import type { HeaderData } from "@/types/resume";
import type { ResumeTheme } from "../templates/theme";
import { InlineEditor } from "../InlineEditor";

interface Props {
  sectionId: string;
  data: HeaderData;
  theme: ResumeTheme;
  accentColor: string;
  editable: boolean;
  logoUrl: string | null;
  logoHidden: boolean;
}

function ContactRow({
  data,
  sectionId,
  editable,
  onWhite,
}: {
  data: HeaderData;
  sectionId: string;
  editable: boolean;
  onWhite?: boolean;
}) {
  const update = useResumeStore((s) => s.updateSectionData);
  const itemClass = cn(
    "flex items-center gap-1.5 text-[12px]",
    onWhite ? "text-white/90" : "text-gray-600"
  );
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className={itemClass}>
        <Mail className="h-3.5 w-3.5 shrink-0" />
        <InlineEditor
          content={data.email}
          multiline={false}
          editable={editable}
          placeholder="email@example.com"
          onChange={(v) => update(sectionId, { email: v })}
        />
      </span>
      <span className={itemClass}>
        <Phone className="h-3.5 w-3.5 shrink-0" />
        <InlineEditor
          content={data.phone}
          multiline={false}
          editable={editable}
          placeholder="phone"
          onChange={(v) => update(sectionId, { phone: v })}
        />
      </span>
      <span className={itemClass}>
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <InlineEditor
          content={data.location}
          multiline={false}
          editable={editable}
          placeholder="location"
          onChange={(v) => update(sectionId, { location: v })}
        />
      </span>
    </div>
  );
}

export function HeaderSection({
  sectionId,
  data,
  theme,
  accentColor,
  editable,
  logoUrl,
  logoHidden,
}: Props) {
  const update = useResumeStore((s) => s.updateSectionData);
  const setLogoHidden = useResumeStore((s) => s.setLogoHidden);

  const NameTitle = ({ onWhite }: { onWhite?: boolean }) => (
    <div className="min-w-0">
      <InlineEditor
        content={data.candidateName}
        multiline={false}
        editable={editable}
        placeholder="Candidate Name"
        className={cn(
          "text-[26px] font-bold leading-tight",
          onWhite ? "text-white" : "text-gray-900"
        )}
        onChange={(v) => update(sectionId, { candidateName: v })}
      />
      <InlineEditor
        content={data.title}
        multiline={false}
        editable={editable}
        placeholder="Current Title"
        className={cn(
          "text-[15px] font-medium",
          onWhite ? "text-white/90" : "text-gray-600"
        )}
        onChange={(v) => update(sectionId, { title: v })}
      />
    </div>
  );

  const Logo = ({ onWhite }: { onWhite?: boolean }) => {
    // Explicitly removed → no logo area at all.
    if (logoHidden) return null;
    if (logoUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt="Logo"
          className="h-12 w-auto max-w-[140px] object-contain"
        />
      );
    }
    // Read-only view (e.g. client) shows nothing when there's no logo.
    if (!editable) return null;
    // Editable placeholder — click the × to remove the logo area entirely.
    return (
      <div className="group/logo relative">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded text-[10px] font-medium",
            onWhite ? "bg-white/15 text-white/70" : "bg-gray-100 text-gray-400"
          )}
        >
          LOGO
        </div>
        <button
          type="button"
          onClick={() => setLogoHidden(true)}
          title="Remove logo"
          className={cn(
            "absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full opacity-0 shadow transition-opacity group-hover/logo:opacity-100",
            onWhite ? "bg-white text-gray-700" : "bg-gray-700 text-white"
          )}
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </div>
    );
  };

  // ── Banner (classic / compact) ──
  if (theme.headerVariant === "banner" || theme.headerVariant === "compact") {
    const pad = theme.headerVariant === "compact" ? "px-8 py-4" : "px-10 py-6";
    return (
      <div className="-mx-px overflow-hidden">
        <div
          className={cn("flex items-center gap-4", pad)}
          style={{ backgroundColor: accentColor }}
        >
          <Logo onWhite />
          <NameTitle onWhite />
        </div>
        <div className="bg-gray-50 px-10 py-2.5">
          <ContactRow data={data} sectionId={sectionId} editable={editable} />
        </div>
      </div>
    );
  }

  // ── Sidebar accent bar (modern) ──
  if (theme.headerVariant === "sidebar") {
    return (
      <div className="flex items-start gap-4 px-10 pt-10">
        <div
          className="mt-1 h-16 w-1.5 shrink-0 rounded"
          style={{ backgroundColor: accentColor }}
        />
        <div className="flex flex-1 items-start justify-between gap-4">
          <div className="min-w-0">
            <InlineEditor
              content={data.candidateName}
              multiline={false}
              editable={editable}
              placeholder="Candidate Name"
              className="text-[28px] font-bold leading-tight text-gray-900"
              onChange={(v) => update(sectionId, { candidateName: v })}
            />
            <InlineEditor
              content={data.title}
              multiline={false}
              editable={editable}
              placeholder="Current Title"
              className="text-[15px] font-medium"
              onChange={(v) => update(sectionId, { title: v })}
            />
            <div className="mt-2">
              <ContactRow
                data={data}
                sectionId={sectionId}
                editable={editable}
              />
            </div>
          </div>
          <Logo />
        </div>
      </div>
    );
  }

  // ── Plain (minimal) ──
  return (
    <div className="px-14 pt-14">
      <div className="flex items-start justify-between gap-4">
        <InlineEditor
          content={data.candidateName}
          multiline={false}
          editable={editable}
          placeholder="Candidate Name"
          className="text-[32px] font-light leading-tight"
          onChange={(v) => update(sectionId, { candidateName: v })}
        />
        <Logo />
      </div>
      <InlineEditor
        content={data.title}
        multiline={false}
        editable={editable}
        placeholder="Current Title"
        className="text-[15px] uppercase tracking-wide text-gray-500"
        onChange={(v) => update(sectionId, { title: v })}
      />
      <div
        className="mt-3 mb-1 h-px w-full"
        style={{ backgroundColor: accentColor }}
      />
      <ContactRow data={data} sectionId={sectionId} editable={editable} />
    </div>
  );
}
