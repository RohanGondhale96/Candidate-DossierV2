"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Download,
  Star,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

import { useResumeStore, type ResumeServerData } from "@/stores/resumeStore";
import { computeScores } from "@/lib/scoring";
import { fitStars } from "@/lib/candidate-ui";
import { exportResumeToPdf } from "@/lib/pdf";
import type { PipelineStage } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ResumeCanvas } from "@/components/resume-builder/ResumeCanvas";
import { ReviewActions } from "@/components/client-review/ReviewActions";
import { StatusBadge } from "@/components/client-review/StatusBadge";
import { CommentThread } from "@/components/comments/CommentThread";

export default function ClientReviewPage({
  params,
}: {
  params: { candidateJobId: string };
}) {
  const initFromServer = useResumeStore((s) => s.initFromServer);
  const initialized = useResumeStore((s) => s.initialized);
  const content = useResumeStore((s) => s.content);
  const jobRequiredSkills = useResumeStore((s) => s.jobRequiredSkills);
  const jobRequirements = useResumeStore((s) => s.jobRequirements);

  const scores = useMemo(
    () => computeScores(content, jobRequiredSkills, jobRequirements),
    [content, jobRequiredSkills, jobRequirements]
  );

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [meta, setMeta] = useState<{
    candidateName: string;
    jobTitle: string;
    clientName: string;
  } | null>(null);
  const [stage, setStage] = useState<PipelineStage>("IN_REVIEW");
  const [exporting, setExporting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await exportResumeToPdf(`${meta?.candidateName || "Resume"} — Resume`);
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
        setMeta({
          candidateName: data.candidateName,
          jobTitle: data.jobTitle,
          clientName: data.clientName,
        });
        setStage(data.stage);
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

  if (status === "loading") {
    return (
      <div className="flex h-[70vh] items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading candidate…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-center">
        <AlertCircle className="mb-3 h-8 w-8 text-destructive" />
        <h1 className="text-lg font-semibold">Could not load candidate</h1>
        <p className="mt-1 text-sm text-muted-foreground">{errorMsg}</p>
        <Link
          href="/client/dashboard"
          className="mt-4 text-sm text-primary hover:underline"
        >
          ← Back to candidates
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Action bar */}
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
          <Link
            href="/client/dashboard"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100"
            title="Back to candidates"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold leading-tight">
                {meta?.candidateName}
              </span>
              <StatusBadge stage={stage} />
            </div>
            <div className="truncate text-xs leading-tight text-muted-foreground">
              {meta?.jobTitle}
            </div>
          </div>

          {initialized && (
            <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
              <span className="text-xs text-muted-foreground">Fitscore</span>
              <span className="text-sm font-semibold tabular-nums text-gray-900">
                {fitStars(scores.jobMatchScore)}/5
              </span>
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            </div>
          )}

          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCommentsOpen(true)}
              className="gap-1.5"
            >
              <MessageSquare className="h-4 w-4" />
              Comments
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={exporting || !initialized}
              className="gap-1.5"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              PDF
            </Button>
            {initialized && (
              <ReviewActions
                candidateJobId={params.candidateJobId}
                candidateName={meta?.candidateName ?? "this candidate"}
                stage={stage}
                onChanged={setStage}
              />
            )}
          </div>
        </div>
      </div>

      {/* Read-only resume */}
      <div className="pb-12">
        {initialized && <ResumeCanvas editable={false} />}
      </div>

      {/* Comments — right-side drawer */}
      <Sheet open={commentsOpen} onOpenChange={setCommentsOpen}>
        <SheetContent className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Comments</SheetTitle>
            <SheetDescription>
              Share feedback on {meta?.candidateName ?? "this candidate"} with
              your staffing partner.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 flex-1 overflow-y-auto">
            <CommentThread candidateJobId={params.candidateJobId} hideHeader />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
