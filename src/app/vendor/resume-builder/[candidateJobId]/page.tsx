"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Save,
  Loader2,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
  GripVertical,
  Undo2,
  Redo2,
} from "lucide-react";
import { toast } from "sonner";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useResumeStore, type ResumeServerData } from "@/stores/resumeStore";
import { SECTION_TITLES } from "@/types/resume";
import type { ResumeSection } from "@/types/resume";
import { cn } from "@/lib/utils";
import { AddSectionMenu } from "@/components/resume-builder/AddSectionMenu";
import { exportResumeToPdf } from "@/lib/pdf";
import { Button } from "@/components/ui/button";
import { ResumeCanvas } from "@/components/resume-builder/ResumeCanvas";
import { TemplateSelector } from "@/components/resume-builder/TemplateSelector";
import { ColorPicker } from "@/components/resume-builder/ColorPicker";
import { FontPicker } from "@/components/resume-builder/FontPicker";
import { LogoUploader } from "@/components/resume-builder/LogoUploader";
import { ScoreDisplay } from "@/components/resume-builder/ScoreDisplay";
import { VersionHistory } from "@/components/resume-builder/VersionHistory";
import { AIAssistantPanel } from "@/components/resume-builder/AIAssistantPanel";
import { SendToClientButton } from "@/components/resume-builder/SendToClientButton";
import { JobDescriptionDialog } from "@/components/resume-builder/JobDescriptionDialog";
import {
  AutoSave,
  AutoSaveIndicator,
} from "@/components/resume-builder/AutoSave";

function PanelGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </h3>
      {children}
    </div>
  );
}

function SortableSectionRow({
  section,
  onToggle,
}: {
  section: ResumeSection;
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1.5 rounded px-2 py-1.5",
        !section.visible && "opacity-40"
      )}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 truncate text-[13px]">
        {SECTION_TITLES[section.type]}
      </span>
      <button
        type="button"
        onClick={onToggle}
        aria-label={section.visible ? "Hide section" : "Show section"}
        className="shrink-0 text-gray-400 transition-colors hover:text-gray-600"
      >
        {section.visible ? (
          <Eye className="h-4 w-4 text-[#0076FB]" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

function ComponentsPanel() {
  const sections = useResumeStore((s) => s.content.sections);
  const toggleVisibility = useResumeStore((s) => s.toggleSectionVisibility);
  const reorderSections = useResumeStore((s) => s.reorderSections);

  const manageable = sections.filter(
    (s) => s.type !== "header" && s.type !== "recruiter_note"
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = sections.findIndex((s) => s.id === active.id);
    const to = sections.findIndex((s) => s.id === over.id);
    if (from !== -1 && to !== -1) reorderSections(from, to);
  }

  return (
    <div className="px-4 py-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={manageable.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="mb-4 space-y-0.5">
            {manageable.map((section) => (
              <SortableSectionRow
                key={section.id}
                section={section}
                onToggle={() => toggleVisibility(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <AddSectionMenu />
    </div>
  );
}

export default function ResumeBuilderPage({
  params,
}: {
  params: { candidateJobId: string };
}) {
  const initFromServer = useResumeStore((s) => s.initFromServer);
  const saveResume = useResumeStore((s) => s.saveResume);
  const isSaving = useResumeStore((s) => s.isSaving);
  const candidateName = useResumeStore((s) => s.candidateName);
  const jobTitle = useResumeStore((s) => s.jobTitle);
  const initialized = useResumeStore((s) => s.initialized);
  const undo = useResumeStore((s) => s.undo);
  const redo = useResumeStore((s) => s.redo);
  const canUndo = useResumeStore((s) => s.past.length > 0);
  const canRedo = useResumeStore((s) => s.future.length > 0);

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [aiCollapsed, setAiCollapsed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<"design" | "components">("components");

  async function handleExport() {
    setExporting(true);
    try {
      await exportResumeToPdf(`${candidateName || "Resume"} — Resume`);
    } catch {
      toast.error("Could not generate PDF");
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/candidate-jobs/${params.candidateJobId}/resume`
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `Error ${res.status}`);
        }
        const data: ResumeServerData = await res.json();
        if (cancelled) return;
        initFromServer(data);
        setStatus("ready");
      } catch (e) {
        if (cancelled) return;
        setErrorMsg(e instanceof Error ? e.message : "Failed to load");
        setStatus("error");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.candidateJobId, initFromServer]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      // Don't intercept while typing inside a text field or rich editor.
      const target = e.target as HTMLElement;
      if (
        target.tagName === "TEXTAREA" ||
        target.tagName === "INPUT" ||
        target.contentEditable === "true"
      ) return;
      if (e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === "z" && e.shiftKey)  { e.preventDefault(); redo(); }
      if (e.key === "y")                { e.preventDefault(); redo(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

  async function handleManualSave() {
    const ok = await saveResume("Manual save");
    if (ok) toast.success("Resume saved");
  }

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading resume builder…</span>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/40">
        <div className="max-w-sm text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h1 className="text-lg font-semibold">Could not load resume</h1>
          <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
          <Link
            href="/vendor/dossier"
            className="mt-4 inline-block text-sm text-primary hover:underline"
          >
            ← Back to Dossier
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-muted/40">
      {initialized && <AutoSave />}

      <JobDescriptionDialog
        open={jobDialogOpen}
        onOpenChange={setJobDialogOpen}
      />

      {/* Top bar */}
      <header className="no-print flex h-14 shrink-0 items-center justify-between border-b bg-white px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/vendor/dossier"
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100"
            title="Back to Dossier"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="text-sm font-semibold leading-tight">
              {candidateName}
            </div>
            <div className="text-xs leading-tight text-muted-foreground">
              <button
                type="button"
                onClick={() => setJobDialogOpen(true)}
                className="group inline-flex items-center gap-1 rounded-sm hover:text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="View job description"
              >
                {jobTitle}
                <Info className="h-3 w-3 opacity-60 group-hover:opacity-100" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AutoSaveIndicator />

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="h-8 w-8 p-0"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
              className="h-8 w-8 p-0"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-5 w-px bg-gray-200" />

          <Button
            size="sm"
            variant="outline"
            onClick={handleManualSave}
            disabled={isSaving}
            className="gap-1.5"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
            className="gap-1.5"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export PDF
          </Button>
          <SendToClientButton />
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Left panel */}
        <aside className="no-print flex w-[230px] shrink-0 flex-col overflow-hidden border-r bg-white">
          {/* Profile Clarity — always visible at top */}
          <div className="shrink-0 border-b px-4 py-3">
            <ScoreDisplay />
          </div>

          {/* Tab switcher */}
          <div className="shrink-0 border-b">
            <div className="flex">
              <button
                onClick={() => setLeftTab("components")}
                className={cn(
                  "flex-1 py-2.5 text-[12px] font-semibold transition-colors",
                  leftTab === "components"
                    ? "border-b-2 border-[#0076FB] text-[#0076FB]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Sections
              </button>
              <button
                onClick={() => setLeftTab("design")}
                className={cn(
                  "flex-1 py-2.5 text-[12px] font-semibold transition-colors",
                  leftTab === "design"
                    ? "border-b-2 border-[#0076FB] text-[#0076FB]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Design
              </button>
            </div>
          </div>

          {/* Scrollable tab content */}
          <div className="min-h-0 flex-1 divide-y overflow-y-auto">
            {leftTab === "design" ? (
              <>
                <PanelGroup label="Template">
                  <TemplateSelector />
                </PanelGroup>
                <PanelGroup label="Accent color">
                  <ColorPicker />
                </PanelGroup>
                <PanelGroup label="Font">
                  <FontPicker />
                </PanelGroup>
                <PanelGroup label="Logo">
                  <LogoUploader />
                </PanelGroup>
              </>
            ) : (
              <ComponentsPanel />
            )}
          </div>

          {/* History — always pinned at bottom */}
          <div className="shrink-0 border-t px-4 py-3">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              History
            </h3>
            <VersionHistory />
          </div>
        </aside>

        {/* Center canvas */}
        <main className="min-w-0 flex-1 overflow-auto">
          <ResumeCanvas editable />
        </main>

        {/* Right AI panel */}
        <AIAssistantPanel
          collapsed={aiCollapsed}
          onToggle={() => setAiCollapsed((c) => !c)}
        />
      </div>
    </div>
  );
}
