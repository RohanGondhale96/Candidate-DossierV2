"use client";

import { useEffect, useMemo, useState } from "react";
import { Send, Check, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useResumeStore } from "@/stores/resumeStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  ResumeContent,
  ResumeSection,
  ResumeSectionType,
  HeaderData,
  SkillsData,
} from "@/types/resume";

interface CheckItem {
  label: string;
  ok: boolean;
}

function sectionText(s?: ResumeSection): string {
  if (!s || !s.visible) return "";
  const d = s.data as { content?: string };
  return (d.content ?? "").replace(/<[^>]*>/g, "").trim();
}

function sectionEntryCount(s?: ResumeSection): number {
  if (!s || !s.visible) return 0;
  const d = s.data as { entries?: unknown[] };
  return Array.isArray(d.entries) ? d.entries.length : 0;
}

// A real check of the resume content — which sections exist, are visible, and
// actually have something in them. Used to warn (never block) before sending.
function buildChecklist(content: ResumeContent): CheckItem[] {
  const byType = new Map<ResumeSectionType, ResumeSection>();
  for (const s of content.sections) byType.set(s.type, s);

  const header = byType.get("header");
  const headerOk =
    !!header &&
    header.visible &&
    !!(header.data as HeaderData).candidateName?.trim();

  const skills = byType.get("skills");
  const skillsOk =
    !!skills &&
    skills.visible &&
    ((skills.data as SkillsData).skills?.length ?? 0) > 0;

  return [
    { label: "Candidate personal details", ok: headerOk },
    { label: "Recruiter note", ok: !!sectionText(byType.get("recruiter_note")) },
    { label: "Summary", ok: !!sectionText(byType.get("summary")) },
    { label: "Assessed Skills", ok: skillsOk },
    { label: "Experience", ok: sectionEntryCount(byType.get("experience")) > 0 },
    { label: "Education", ok: sectionEntryCount(byType.get("education")) > 0 },
    {
      label: "Certification",
      ok: sectionEntryCount(byType.get("certifications")) > 0,
    },
  ];
}

export function SendToClientButton() {
  const candidateJobId = useResumeStore((s) => s.candidateJobId);
  const clientName = useResumeStore((s) => s.clientName);
  const stage = useResumeStore((s) => s.stage);
  const setStage = useResumeStore((s) => s.setStage);
  const saveResume = useResumeStore((s) => s.saveResume);
  const content = useResumeStore((s) => s.content);

  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [revealed, setRevealed] = useState(0);

  const checklist = useMemo(() => buildChecklist(content), [content]);
  const done = revealed >= checklist.length;
  const missingCount = checklist.filter((c) => !c.ok).length;

  const alreadySent = stage !== "INCOMING";

  // Staggered "checking…" reveal each time the modal opens.
  useEffect(() => {
    if (!open) {
      setRevealed(0);
      return;
    }
    setRevealed(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= checklist.length) clearInterval(id);
    }, 320);
    return () => clearInterval(id);
  }, [open, checklist.length]);

  async function handleSend() {
    if (!candidateJobId) return;
    setSending(true);
    try {
      // Persist current state first (ensures a resume row exists)
      await saveResume("Sent to client");
      const res = await fetch(
        `/api/candidate-jobs/${candidateJobId}/send-to-client`,
        { method: "POST" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to send");
      }
      setStage("PRESENTED");
      toast.success("Profile sent to client for review");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  if (alreadySent) {
    return (
      <Button size="sm" variant="secondary" disabled className="gap-1.5">
        <Check className="h-4 w-4" />
        Sent
      </Button>
    );
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Send className="h-4 w-4" />
        Send to Client
      </Button>

      <Dialog open={open} onOpenChange={(o) => !sending && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pre-flight check</DialogTitle>
            <DialogDescription>
              Reviewing the profile before sending to{" "}
              {clientName || "the client"} for review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-0.5 py-1">
            {checklist.map((item, i) => {
              const resolved = i < revealed;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {!resolved ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : item.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "transition-colors",
                      !resolved && "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                  {resolved && !item.ok && (
                    <span className="ml-auto text-xs font-medium text-amber-600">
                      Missing or empty
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {done && missingCount > 0 && (
            <div className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              {missingCount} section{missingCount === 1 ? "" : "s"} look
              {missingCount === 1 ? "s" : ""} incomplete — you can still send, but
              the client won&apos;t see those.
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={sending}
            >
              {done && missingCount > 0 ? "Back to edit" : "Cancel"}
            </Button>
            <Button onClick={handleSend} disabled={!done || sending}>
              {(sending || !done) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {!done
                ? "Checking…"
                : missingCount > 0
                  ? "Send anyway"
                  : "Send to client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
