// Live resume scoring — a LOCAL, deterministic heuristic (no AI call).
// Phase 2 will replace this with Anthropic-based analysis; until then this gives
// the editor real, responsive feedback that updates as the vendor edits.

import type {
  ResumeContent,
  SkillsData,
  SummaryData,
  ExperienceData,
  EducationData,
  RecruiterNoteData,
  CertificationsData,
} from "@/types/resume";

export interface ScoreFactor {
  label: string;
  points: number;
  max: number;
}

export interface ScoreResult {
  jobMatchScore: number;
  qualityScore: number;
  qualityBreakdown: ScoreFactor[];
  jobMatchBreakdown: ScoreFactor[];
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "your", "our", "are", "will", "have",
  "this", "that", "from", "they", "their", "but", "not", "all", "can", "has",
  "experience", "years", "strong", "preferred", "plus", "team", "work",
  "working", "ability", "skills", "role", "must", "should", "good", "using",
]);

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function wordCount(text: string): number {
  const t = stripHtml(text);
  return t ? t.split(/\s+/).length : 0;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function getSection<T>(content: ResumeContent, type: string): T | null {
  const s = content.sections.find((x) => x.type === type && x.visible);
  return s ? (s.data as T) : null;
}

/** Flatten all visible resume text for keyword matching. */
function fullText(content: ResumeContent): string {
  const parts: string[] = [];
  for (const s of content.sections) {
    if (!s.visible) continue;
    const d = s.data as unknown as {
      content?: string;
      skills?: Array<{ name: string }>;
      entries?: Array<Record<string, unknown>>;
    };
    if (typeof d.content === "string") parts.push(stripHtml(d.content));
    if (Array.isArray(d.skills)) {
      parts.push(d.skills.map((k) => k.name).join(" "));
    }
    if (Array.isArray(d.entries)) {
      for (const e of d.entries) {
        parts.push(
          [e.title, e.company, e.field, e.degree, e.institution, e.name, e.issuer]
            .filter((v): v is string => typeof v === "string")
            .join(" ")
        );
        if (typeof e.description === "string") {
          parts.push(stripHtml(e.description));
        }
      }
    }
  }
  return parts.join(" ").toLowerCase();
}

export function computeScores(
  content: ResumeContent,
  requiredSkills: string[],
  requirements: string
): ScoreResult {
  const skills = getSection<SkillsData>(content, "skills")?.skills ?? [];
  const summary = getSection<SummaryData>(content, "summary")?.content ?? "";
  const note = getSection<RecruiterNoteData>(content, "recruiter_note")?.content ?? "";
  const exp = getSection<ExperienceData>(content, "experience")?.entries ?? [];
  const edu = getSection<EducationData>(content, "education")?.entries ?? [];
  const certs =
    getSection<CertificationsData>(content, "certifications")?.entries ?? [];

  // ── Quality ──────────────────────────────────────────────
  // Tuned to reward a reasonably complete profile generously: having real
  // experience/skills counts even when descriptions are brief; long, metric-rich
  // content earns the top of the range.
  const summaryWords = wordCount(summary);
  const summaryPts = Math.min(18, (summaryWords / 25) * 18); // ~25 words = full

  const skillsPts = Math.min(18, (skills.length / 6) * 18); // 6 skills = full

  // 12 pts per experience entry just for existing, +6 for a fleshed-out
  // description (+3 for a short one), capped at 30.
  const expPts = Math.min(
    30,
    exp.reduce((sum, e) => {
      const w = wordCount(e.description);
      return sum + 12 + (w >= 8 ? 6 : w > 0 ? 3 : 0);
    }, 0)
  );

  const eduPts = edu.length > 0 ? 12 : 0;

  const expText = exp.map((e) => stripHtml(e.description)).join(" ");
  const hasMetrics = /\d+%|\d[\d,]*\+?|₹|\$/.test(expText);
  const metricsPts = hasMetrics ? 12 : 0;

  const notePts = wordCount(note) >= 5 ? 5 : wordCount(note) > 0 ? 3 : 0;
  const certPts = certs.length > 0 ? 5 : 0;

  const qualityBreakdown: ScoreFactor[] = [
    { label: "Professional summary", points: Math.round(summaryPts), max: 18 },
    { label: "Skills coverage", points: Math.round(skillsPts), max: 18 },
    { label: "Detailed experience", points: Math.round(expPts), max: 30 },
    { label: "Quantifiable impact", points: metricsPts, max: 12 },
    { label: "Education", points: eduPts, max: 12 },
    { label: "Recruiter note", points: notePts, max: 5 },
    { label: "Certifications", points: certPts, max: 5 },
  ];
  const qualityScore = clamp(
    qualityBreakdown.reduce((sum, f) => sum + f.points, 0)
  );

  // ── Job match ────────────────────────────────────────────
  const resumeText = fullText(content);
  const skillNames = skills.map((s) => s.name.toLowerCase());

  let matchedSkills = 0;
  for (const req of requiredSkills) {
    const r = req.toLowerCase();
    if (skillNames.some((s) => s.includes(r) || r.includes(s)) || resumeText.includes(r)) {
      matchedSkills++;
    }
  }
  const skillCoverage = requiredSkills.length
    ? matchedSkills / requiredSkills.length
    : 0;

  const reqTokens = Array.from(
    new Set(
      stripHtml(requirements)
        .toLowerCase()
        .split(/[^a-z0-9+#.]+/)
        .filter((w) => w.length > 3 && !STOPWORDS.has(w))
    )
  );
  let matchedTokens = 0;
  for (const tok of reqTokens) {
    if (resumeText.includes(tok)) matchedTokens++;
  }
  const keywordCoverage = reqTokens.length ? matchedTokens / reqTokens.length : 0;

  const skillPts = skillCoverage * (requiredSkills.length ? 65 : 0);
  const kwPts = keywordCoverage * (requiredSkills.length ? 35 : 100);

  const jobMatchBreakdown: ScoreFactor[] = [
    {
      label: "Required skills matched",
      points: Math.round(skillPts),
      max: requiredSkills.length ? 65 : 0,
    },
    {
      label: "Keyword alignment",
      points: Math.round(kwPts),
      max: requiredSkills.length ? 35 : 100,
    },
  ];
  const jobMatchScore = clamp(skillPts + kwPts);

  return { jobMatchScore, qualityScore, qualityBreakdown, jobMatchBreakdown };
}
