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
} from "lucide-react";
import { toast } from "sonner";

import { useResumeStore, type ResumeServerData } from "@/stores/resumeStore";
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

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [aiCollapsed, setAiCollapsed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [jobDialogOpen, setJobDialogOpen] = useState(false);

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
        <aside className="no-print w-[230px] shrink-0 divide-y overflow-auto border-r bg-white">
          <div className="px-4 py-3">
            <ScoreDisplay />
          </div>
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
          <PanelGroup label="History">
            <VersionHistory />
          </PanelGroup>
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
