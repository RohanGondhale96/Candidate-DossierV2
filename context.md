# Candidate Dossier — Working Context / Handoff

> Full project state for resuming work (e.g. after `/compact`).
> Fresh session: read this top to bottom before acting. **NEXT TASK: deploy to GitHub + Vercel (see §12).**

## 1. What this is
**Candidate Dossier** — a product for staffing **vendors** to turn raw candidate data (from "RippleHire") into polished, client-ready resumes, manage candidates through a hiring pipeline (Kanban "Dossier board"), and let **clients** review/act on them. Two roles: VENDOR and CLIENT.

## 2. Where it lives & how to run (LOCAL)
- App root: `C:\Users\User\OneDrive\Desktop\Figma Downloads\RH Candidate Dosier\candidate-dossier`
- **Run (prod build, stable):**
  ```powershell
  cd "C:\Users\User\OneDrive\Desktop\Figma Downloads\RH Candidate Dosier\candidate-dossier"
  $env:NODE_EXTRA_CA_CERTS="C:\Users\User\win-ca-bundle.pem"
  npm run build ; npm run start    # http://localhost:3000
  ```
- **Env gotchas:** corporate TLS proxy → EVERY npm/npx/prisma cmd needs `$env:NODE_EXTRA_CA_CERTS="C:\Users\User\win-ca-bundle.pem"` (local only; NOT needed on Vercel). PowerShell cwd resets between calls → always `Set-Location` into candidate-dossier. Typecheck with `node node_modules/typescript/bin/tsc --noEmit` (NOT `npx tsc`). After code change on prod server: rebuild + restart.
- **Preview/verify tooling:** Chrome extension offline; used Claude Preview MCP (`.claude/launch.json` at REPO ROOT, runtimeArgs `["--prefix","candidate-dossier","run","start"]`, port 3000, autoPort:false). `preview_screenshot` TIMES OUT here — verify via `preview_eval` reading DOM/computed styles. Login in preview via POST `/api/auth/callback/credentials` with csrfToken from `/api/auth/csrf` (form clicks don't trigger React; Radix Select/Sheet not drivable by synthetic events).

## 3. Tech stack
Next.js 14 (App Router) · TS · **Tailwind v3 + classic shadcn/Radix (HSL CSS vars, NOT v4/OKLCH)** · NextAuth v4 (Credentials, JWT, roles) · Prisma 5 + **SQLite** · Zustand (resume store) · Tiptap (inline edit) · dnd-kit · html2canvas + jsPDF · @fontsource · sonner.

## 4. Data model (SQLite → JSON strings, no native enums/arrays; parsed via parseJson in lib/api.ts)
Migrations: init, add_logo_hidden, add_font_family, add_candidate_notice_salary.
- **Candidate**: firstName,lastName,email,phone,currentTitle,yearsOfExperience,location,**noticePeriod**,**expectedSalary**,skills(JSON string[]),summary,experience(JSON),education(JSON),certifications(JSON?). 
- **CandidateJob**: stage(String), rejectedAtStage(String?), recruiterNotes, relations candidate/job/vendor(User)/resume/comments.
- **Job**: title,description,requirements,requiredSkills(JSON),location,salaryRange,openPositions,clientId.
- **ResumeData / ResumeVersion**: templateId,accentColor,fontFamily,logoUrl,logoHidden,content(JSON ResumeContent),jobMatchScore,qualityScore.
- **ResumeContent.sections[]**: {id,type,order,visible,data}. types: header,recruiter_note,summary,skills,experience,education,certifications,custom. **SkillItem now has `rating?: number`** (0–5, 0.5 steps).
- Org, User, VendorJobAssignment, Comment.

## 5. Pipeline stages (the 7 board columns, in order) — src/lib/constants.ts
`SHORTLISTED`(Shortlisted) · `IN_REVIEW`(In Review) · `REVIEW_ACCEPTED`(Review Accepted) · `SCHEDULED_INTERVIEW`(Scheduled Interview) · `PENDING_FEEDBACK`(Pending Feedback) · `ACCEPTED`(Accepted) · `REJECTED`(Rejected). VALID_TRANSITIONS = all-to-all (drag fully reversible). STAGE_LABELS + STAGE_SHORT_LABELS + KEBAB_ACTIONS keyed by these. Flow: vendor Send-to-client → IN_REVIEW; client "Request interview" → REVIEW_ACCEPTED; vendor schedules → SCHEDULED_INTERVIEW; PENDING_FEEDBACK after interview; ACCEPTED = hired.

## 6. Demo logins (all password `password123`)
- Vendors: `vendor1@ripplehire.com` (Rahul, RippleHire Staffing), `vendor2@ripplehire.com` (Priya, HireWave Solutions)
- Clients: `client1@acmebank.com` (Amit, Acme Bank), `client2@globexsecurities.com` (Neha, Globex Securities)
- Reseed: `npm run db:seed` (wipes + recreates → **regenerates IDs + invalidates sessions, log in fresh**; runs augment at end). `npm run db:augment` idempotent extras. `npm run print-ids` lists candidateJobIds.

## 7. Seed/augment guarantees (prisma/seed.ts + augment.ts)
- Every candidate has the MINIMUM: personal details, recruiter note, summary, ≥4 skills, ≥1 experience, ≥1 education, ≥1 certification (via `ensureMinimum()` + role-based defaults). Recruiter notes on ALL candidate-jobs.
- Skill **ratings** deterministic from name (`skillRating` in lib/resume-content.ts, 2.0–5.0).
- noticePeriod (pool) + expectedSalary (from years) generated per candidate.

## 8. Design system (FOLLOW SHADCN; restraint = color only on interactive/active)
- **Primary = RippleHire blue `#0076FB` = hsl(212 100% 49%)** in globals.css (`--primary`/`--ring`). NO custom brand/canvas tokens — tints via `bg-primary/10`, surfaces `bg-card`/`bg-background`, app canvas `bg-muted/40`, focus `ring-ring`. No hardcoded hex in UI (exception: `types/resume.ts` DEFAULT_ACCENT is resume DATA).
- NO per-stage rainbow colors (deleted). Tailwind `content` glob = `./src/**/*` (must stay broad).
- Shared helpers in `lib/candidate-ui.ts`: `initials`, `scoreColor`, **`clarityColor`** (≥80 green/60–79 amber/<60 red), **`fitStars`** (0–100 → x/5 string).
- Score conventions: **Fitscore = x/5 + amber ★** (card + drawer + client). **Profile clarity = %** colored by clarityColor (vendor only; HIDDEN on client side). "Resume quality" was renamed → "Profile clarity" everywhere.

## 9. VENDOR side
- **Layout** `vendor/(app)/layout.tsx`: NO sidebar (removed). Header = brand (FileText + "Candidate Dossier") + UserMenu. `/vendor/dashboard` page exists but is UNLINKED (login → /vendor/dossier).
- **Dossier board** `vendor/(app)/dossier/page.tsx`: AGGREGATES all the vendor's candidates across jobs (`GET /api/candidates`). Search bar (live, name+jobTitle+skills) + **Fitscore** filter (All/Strong≥75/Moderate50-74/Weak<50) + **Profile clarity** filter (All/High≥80/Medium60-79/Low<60) + count. 7 stage columns, drag reversible.
- **CandidateCard** `components/kanban/CandidateCard.tsx` (w-[360px]): name + jobTitle + StatusBadge + kebab; 2×2 meta (MapPin location / Briefcase years / CalendarClock noticePeriod / IndianRupee expectedSalary); skill chips (top 4 + "+N more" with native `title` tooltip of overflow skills); footer = Fitscore x/5 ★ + Profile clarity %. NO avatar, NO rejected-at chip.
- **Candidate drawer** `components/kanban/CandidateDetailDrawer.tsx` (lg:max-w-[960px]): header avatar+name+StatusBadge; clickable job name → JobDescriptionDialog; mirrors ALL card meta + skills; scores = Fitscore x/5 ★ + Profile clarity % (rings removed; ScoreRing deleted). 3 action buttons: **Move candidate** (dropdown of rounds + destructive Reject→confirm), **Edit Resume**, **Schedule Interview**. TABS: **"Profile"** (resume preview, NO box wrapper, + **Download profile** button → exportResumeToPdf) | **"Comments (n)"** (CommentThread; shows a destructive "Candidate rejected — at {stage}" banner when REJECTED). Reject/JD dialogs are NESTED inside SheetContent (so closing them doesn't close the drawer).

## 10. RESUME BUILDER `vendor/resume-builder/[candidateJobId]`
3-panel: left (score panel = **Profile clarity only**, shown as **%**, NO "Live scores" heading, NO Fitment, NO "AI scoring Phase 2" line; Template; Accent color; Font; Logo; History) · center (ResumeCanvas) · right (AI placeholder). Top bar: candidate name + clickable job title (→ JobDescriptionDialog), NO client name; Save; Export PDF; **Send to Client** = pre-flight checklist modal (real per-section check: Personal details/Recruiter note/Summary/Assessed Skills/Experience/Education/Certification; staggered ✓/⚠ reveal; WARN-not-block "Send anyway"/"Back to edit") → moves to IN_REVIEW.
- **Assessed Skills** section (renamed from "Skills"): each skill = name + `x/5` + colored proficiency bar (green≥3.5/amber2-3.4/red<2), heading "Assessed Skills (N)", 2-col (1-col in Modern sidebar), remove ✕ on hover, **Add Skill with a Rating dropdown** (0.5–5).

## 11. CLIENT side
- **Layout** `client/layout.tsx`: header brands as CLIENT (FileText + "Candidate Dossier" + "Client" pill).
- **Dashboard** `client/dashboard/page.tsx`: forwarded candidates (stage != SHORTLISTED) grouped by job; each row shows **Fitscore x/5 ★** (NO Profile clarity). 
- **Review page** `client/review/[candidateJobId]/page.tsx`: top bar single `flex items-center` row (back · identity name+badge+jobTitle · **Fitscore x/5 ★** · actions). NO Profile clarity. Actions (`ReviewActions.tsx`) = **Request interview** (→ REVIEW_ACCEPTED) + **Reject** (Accept merged into Request interview; client never sets SCHEDULED_INTERVIEW). **Comments** button (top bar) opens a RIGHT-SIDE `Sheet` drawer with CommentThread (moved off the bottom). PDF download present.

## 12. ⭐ DEPLOYMENT — ✅ DONE (live on Vercel, 2026-06-25)
**Status: deployed & sanity-checked by user.** Repo: https://github.com/RohanGondhale96/Candidate-dossier (public, branch `main`). Hosted on Vercel (account `rohangondhale-5913`), DB on **Neon Postgres** (host `ep-curly-boat-ategm5br`). Imported via Vercel dashboard with the Neon integration.
- **What changed for deploy:** schema datasource `sqlite`→`postgresql` (`url`=DATABASE_URL pooled `&pgbouncer=true`, `directUrl`=DIRECT_DATABASE_URL unpooled); kept all String/JSON columns so ZERO app-code changes. `package.json` build=`prisma generate && next build`, added `postinstall`+`db:push`. Deleted `prisma/migrations/` (apply schema via `prisma db push`). `.gitignore` now excludes `.env`,`*.db`,`.claude/`; added `.env.example`. Vercel env: DATABASE_URL, DIRECT_DATABASE_URL, NEXTAUTH_URL(=live URL), NEXTAUTH_SECRET.
- **DB guardrail:** Claude cannot connect/write to the remote Neon DB (non-localhost; user `neondb_owner` ∉ {claude*,cu_*}; no remote write txns). The USER ran `npm run db:push` + `npm run db:seed` locally. To reseed/update prod data later, the USER must run those (with `$env:NODE_EXTRA_CA_CERTS` set and the Neon URLs in local `.env`).
- **Commit rules applied:** subject starts with Jira id `PRD-7847`, ends with trailer `Workflow: rh-assist`, no Co-Authored-By line.
- **Redeploy on new code:** `git push` to `main` → Vercel auto-builds. Schema changes need a manual `npm run db:push` (by user) since build doesn't run migrations.

### (historical) original plan
Goal: shareable working URL. **Blocker: SQLite won't run on Vercel (ephemeral FS) → must move to hosted Postgres.**
Steps (confirm choices with user first):
1. **Provision Postgres** — Neon / Supabase / Vercel Postgres (free tier). Get `DATABASE_URL`. (User action / their account.)
2. **Switch Prisma to Postgres:** `prisma/schema.prisma` datasource `provider = "sqlite"` → `"postgresql"`, `url = env("DATABASE_URL")`. The String+JSON-string columns port fine. DELETE the SQLite `prisma/migrations/` and regenerate for Postgres (`prisma migrate dev --name init` against the new DB) OR `prisma db push`. Then seed the hosted DB (`npm run db:seed`).
3. **Build/prisma:** add `"postinstall": "prisma generate"` (or `build: "prisma generate && next build"`) so Vercel generates the client.
4. **Env vars (Vercel):** `DATABASE_URL`, `NEXTAUTH_URL` (= the deployed URL), `NEXTAUTH_SECRET` (generate a random secret). NODE_EXTRA_CA_CERTS NOT needed on Vercel.
5. **GitHub:** repo is NOT a git repo yet (`git init`). Use `gh` CLI to create + push. (Commit-message org conventions apply — handle at commit time; will need a Jira ticket id from the user.) Add a `.gitignore` (node_modules, .next, .env, *.db, prisma/dev.db). Do NOT commit `.env`/dev.db.
6. **Vercel:** import the GitHub repo, set env vars, deploy. **User must log into Vercel/GitHub — I cannot create accounts or auth as them.**
Decisions to ask the user at deploy time: which Postgres provider; the Jira ticket id for commits; GitHub repo name/visibility; confirm they'll do the Vercel/GitHub login.

## 13. Known caveats
- Reseed regenerates IDs + invalidates sessions (re-login). 
- Preview screenshot tool times out → verify via eval. 
- Dev server (`npm run dev`) degrades over time → prod build for demos.
- Build prints a `/api/jobs` DYNAMIC_SERVER_USAGE notice — EXPECTED (reads auth headers), not an error.
- The downloaded PDF from the drawer/review wasn't pixel-verified via automation (download triggers a browser save).

## 14. Persistent agent memory (auto-loads each session)
`C:\Users\User\.claude\projects\C--Users-User-OneDrive-Desktop-Figma-Downloads-RH-Candidate-Dosier\memory\` (MEMORY.md + candidate-dossier-project.md + proxy-ca-cert.md + brainstorm-no-code-changes.md).
