"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useResumeStore } from "@/stores/resumeStore";
import { SECTION_TITLES } from "@/types/resume";
import type { ResumeSectionType, SectionData } from "@/types/resume";

interface Props {
  sectionType: ResumeSectionType | null;
  onClose: () => void;
}

export function AddSectionModal({ sectionType, onClose }: Props) {
  const addSectionWithData = useResumeStore((s) => s.addSectionWithData);

  // Summary
  const [summaryContent, setSummaryContent] = useState("");

  // Experience
  const [expCompany, setExpCompany] = useState("");
  const [expTitle, setExpTitle] = useState("");
  const [expLocation, setExpLocation] = useState("");
  const [expStart, setExpStart] = useState("");
  const [expEnd, setExpEnd] = useState("");
  const [expDesc, setExpDesc] = useState("");

  // Education
  const [eduInstitution, setEduInstitution] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduField, setEduField] = useState("");
  const [eduStart, setEduStart] = useState("");
  const [eduEnd, setEduEnd] = useState("");

  // Certifications
  const [certName, setCertName] = useState("");
  const [certIssuer, setCertIssuer] = useState("");
  const [certDate, setCertDate] = useState("");

  // Skills
  const [skillsInput, setSkillsInput] = useState("");

  // Custom
  const [customTitle, setCustomTitle] = useState("");
  const [customContent, setCustomContent] = useState("");

  // Reset all fields whenever a new type is opened
  useEffect(() => {
    if (!sectionType) return;
    setSummaryContent("");
    setExpCompany(""); setExpTitle(""); setExpLocation(""); setExpStart(""); setExpEnd(""); setExpDesc("");
    setEduInstitution(""); setEduDegree(""); setEduField(""); setEduStart(""); setEduEnd("");
    setCertName(""); setCertIssuer(""); setCertDate("");
    setSkillsInput("");
    setCustomTitle(""); setCustomContent("");
  }, [sectionType]);

  const canSave: boolean = (() => {
    switch (sectionType) {
      case "summary":       return summaryContent.trim().length > 0;
      case "experience":    return expCompany.trim().length > 0 && expTitle.trim().length > 0;
      case "education":     return eduInstitution.trim().length > 0 && eduDegree.trim().length > 0;
      case "certifications":return certName.trim().length > 0;
      case "skills":        return skillsInput.trim().length > 0;
      case "custom":        return customTitle.trim().length > 0;
      default:              return false;
    }
  })();

  function buildData(): SectionData | null {
    switch (sectionType) {
      case "summary":
        return { content: summaryContent.trim() };

      case "experience":
        return {
          entries: [{
            id: crypto.randomUUID(),
            company: expCompany.trim(),
            title: expTitle.trim(),
            location: expLocation.trim() || undefined,
            startDate: expStart.trim(),
            endDate: expEnd.trim() || null,
            description: expDesc.trim(),
          }],
        };

      case "education":
        return {
          entries: [{
            id: crypto.randomUUID(),
            institution: eduInstitution.trim(),
            degree: eduDegree.trim(),
            field: eduField.trim(),
            startDate: eduStart.trim(),
            endDate: eduEnd.trim() || undefined,
          }],
        };

      case "certifications":
        return {
          entries: [{
            id: crypto.randomUUID(),
            name: certName.trim(),
            issuer: certIssuer.trim(),
            dateObtained: certDate.trim() || undefined,
          }],
        };

      case "skills":
        return {
          skills: skillsInput
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((name) => ({ id: crypto.randomUUID(), name })),
        };

      case "custom":
        return { title: customTitle.trim(), content: customContent.trim() };

      default:
        return null;
    }
  }

  function handleSave() {
    if (!sectionType) return;
    const data = buildData();
    if (!data) return;
    addSectionWithData(sectionType, data);
    onClose();
  }

  return (
    <Dialog open={!!sectionType} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add {sectionType ? SECTION_TITLES[sectionType] : "Section"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* ── Summary ─────────────────────────────────── */}
          {sectionType === "summary" && (
            <div>
              <Label>Content</Label>
              <Textarea
                autoFocus
                placeholder="Write a short professional summary…"
                value={summaryContent}
                onChange={(e) => setSummaryContent(e.target.value)}
                className="mt-1.5 h-28 resize-none"
              />
            </div>
          )}

          {/* ── Experience ──────────────────────────────── */}
          {sectionType === "experience" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Company <span className="text-destructive text-xs">*</span></Label>
                  <Input autoFocus className="mt-1.5" placeholder="Acme Corp" value={expCompany} onChange={(e) => setExpCompany(e.target.value)} />
                </div>
                <div>
                  <Label>Job title <span className="text-destructive text-xs">*</span></Label>
                  <Input className="mt-1.5" placeholder="Senior Engineer" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <Label>Location</Label>
                  <Input className="mt-1.5" placeholder="Mumbai" value={expLocation} onChange={(e) => setExpLocation(e.target.value)} />
                </div>
                <div>
                  <Label>Start</Label>
                  <Input className="mt-1.5" placeholder="Jan 2021" value={expStart} onChange={(e) => setExpStart(e.target.value)} />
                </div>
                <div>
                  <Label>End</Label>
                  <Input className="mt-1.5" placeholder="Present" value={expEnd} onChange={(e) => setExpEnd(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea className="mt-1.5 h-24 resize-none" placeholder="Key responsibilities and achievements…" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} />
              </div>
            </>
          )}

          {/* ── Education ───────────────────────────────── */}
          {sectionType === "education" && (
            <>
              <div>
                <Label>Institution <span className="text-destructive text-xs">*</span></Label>
                <Input autoFocus className="mt-1.5" placeholder="IIT Bombay" value={eduInstitution} onChange={(e) => setEduInstitution(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Degree <span className="text-destructive text-xs">*</span></Label>
                  <Input className="mt-1.5" placeholder="B.Tech" value={eduDegree} onChange={(e) => setEduDegree(e.target.value)} />
                </div>
                <div>
                  <Label>Field of study</Label>
                  <Input className="mt-1.5" placeholder="Computer Science" value={eduField} onChange={(e) => setEduField(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start year</Label>
                  <Input className="mt-1.5" placeholder="2018" value={eduStart} onChange={(e) => setEduStart(e.target.value)} />
                </div>
                <div>
                  <Label>End year</Label>
                  <Input className="mt-1.5" placeholder="2022" value={eduEnd} onChange={(e) => setEduEnd(e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* ── Certifications ──────────────────────────── */}
          {sectionType === "certifications" && (
            <>
              <div>
                <Label>Certification name <span className="text-destructive text-xs">*</span></Label>
                <Input autoFocus className="mt-1.5" placeholder="AWS Solutions Architect" value={certName} onChange={(e) => setCertName(e.target.value)} />
              </div>
              <div>
                <Label>Issuer</Label>
                <Input className="mt-1.5" placeholder="Amazon Web Services" value={certIssuer} onChange={(e) => setCertIssuer(e.target.value)} />
              </div>
              <div>
                <Label>Date obtained</Label>
                <Input className="mt-1.5" placeholder="2023-06" value={certDate} onChange={(e) => setCertDate(e.target.value)} />
              </div>
            </>
          )}

          {/* ── Skills ──────────────────────────────────── */}
          {sectionType === "skills" && (
            <div>
              <Label>Skills</Label>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Separate multiple skills with commas
              </p>
              <Input
                autoFocus
                className="mt-1.5"
                placeholder="React, TypeScript, Node.js, AWS"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
              />
            </div>
          )}

          {/* ── Custom ──────────────────────────────────── */}
          {sectionType === "custom" && (
            <>
              <div>
                <Label>Section title <span className="text-destructive text-xs">*</span></Label>
                <Input autoFocus className="mt-1.5" placeholder="Awards & Recognition" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea className="mt-1.5 h-24 resize-none" placeholder="Content for this section…" value={customContent} onChange={(e) => setCustomContent(e.target.value)} />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave}>Add to Profile</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
