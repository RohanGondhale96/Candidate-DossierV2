// Idempotent "extra demo candidates" augmentation.
// Adds, per job: 2 INCOMING + 1 PRESENTED + 1 ACCEPTED candidates
// (role-appropriate, assigned to the vendor that owns the job). Re-runnable:
// candidates keyed by RH-AUG-* rippleHireId and skipped if already present.
//
// Used two ways:
//   - imported by seed.ts and called at the end (so reseed reproduces it)
//   - run standalone against the live DB: `npm run db:augment`

import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { buildInitialResumeContent } from "../src/lib/resume-content";
import type { CandidateProfile } from "../src/types/candidate";

const j = (v: unknown) => JSON.stringify(v);

type Stage = "INCOMING" | "PRESENTED" | "ACCEPTED";

// stage + placeholder scores for the 4 additions per job
const SLOTS: { stage: Stage; jobMatch: number | null; quality: number | null }[] =
  [
    { stage: "INCOMING", jobMatch: null, quality: null },
    { stage: "INCOMING", jobMatch: null, quality: null },
    { stage: "PRESENTED", jobMatch: 72, quality: 69 },
    { stage: "ACCEPTED", jobMatch: 78, quality: 83 },
  ];

interface RoleSpec {
  jobTitle: string;
  vendorEmail: string;
  skills: string[];
  titleWord: string;
  company: string;
  degree: string;
  field: string;
  institution: string;
  names: [string, string][]; // [first, last] × 5
}

const ROLES: RoleSpec[] = [
  {
    jobTitle: "Senior Product Designer",
    vendorEmail: "rec1@ripplehire.com",
    skills: ["Figma", "User Research", "Prototyping", "Design Systems", "Wireframing", "Usability Testing"],
    titleWord: "Product Designer",
    company: "DesignWorks Studio",
    degree: "B.Des",
    field: "Interaction Design",
    institution: "National Institute of Design",
    names: [["Aarav", "Shah"], ["Isha", "Bansal"], ["Tara", "Menon"], ["Dev", "Kapoor"], ["Nisha", "Rao"]],
  },
  {
    jobTitle: "Full Stack Engineer",
    vendorEmail: "rec1@ripplehire.com",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker"],
    titleWord: "Full Stack Engineer",
    company: "BuildStack Labs",
    degree: "B.Tech",
    field: "Computer Science",
    institution: "VIT",
    names: [["Kabir", "Jain"], ["Ria", "Sengupta"], ["Aryan", "Bose"], ["Mira", "Saxena"], ["Veer", "Malhotra"]],
  },
  {
    jobTitle: "Data Analyst",
    vendorEmail: "rec2@ripplehire.com",
    skills: ["SQL", "Python", "Tableau", "Excel", "Statistics", "Power BI"],
    titleWord: "Data Analyst",
    company: "InsightMetrics",
    degree: "M.Sc",
    field: "Statistics",
    institution: "Christ University",
    names: [["Anika", "Ghosh"], ["Rohit", "Bhat"], ["Sara", "Khan"], ["Yash", "Pandey"], ["Diya", "Naik"]],
  },
  {
    jobTitle: "DevOps Engineer",
    vendorEmail: "rec1@ripplehire.com",
    skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Jenkins"],
    titleWord: "DevOps Engineer",
    company: "CloudOps Systems",
    degree: "B.E.",
    field: "Information Technology",
    institution: "PSG College of Technology",
    names: [["Aman", "Sinha"], ["Pia", "Chawla"], ["Nikhil", "Varma"], ["Tanvi", "Joshi"], ["Ishaan", "Roy"]],
  },
  {
    jobTitle: "Backend Engineer",
    vendorEmail: "rec2@ripplehire.com",
    skills: ["Java", "Spring Boot", "Microservices", "PostgreSQL", "Redis", "Kafka"],
    titleWord: "Backend Engineer",
    company: "CoreServe Tech",
    degree: "B.Tech",
    field: "Computer Engineering",
    institution: "COEP",
    names: [["Kiran", "Pillai"], ["Neel", "Gupta"], ["Avni", "Desai"], ["Raghav", "Iyer"], ["Sneha", "Kulkarni"]],
  },
];

const NOTE =
  "Strong fit for this role — relevant skills and a track record of impact. Recommend an early conversation.";

function certFor(role: RoleSpec): {
  name: string;
  issuer: string;
  dateObtained: string;
} {
  const t = role.jobTitle.toLowerCase();
  if (t.includes("design"))
    return { name: "Google UX Design Certificate", issuer: "Google", dateObtained: "2022-05" };
  if (t.includes("data"))
    return { name: "Tableau Desktop Specialist", issuer: "Tableau", dateObtained: "2022-08" };
  if (t.includes("devops"))
    return { name: "Certified Kubernetes Administrator", issuer: "CNCF", dateObtained: "2022-06" };
  if (t.includes("backend"))
    return { name: "Oracle Certified Professional, Java SE", issuer: "Oracle", dateObtained: "2022-03" };
  return { name: "AWS Certified Developer", issuer: "Amazon Web Services", dateObtained: "2022-10" };
}

const NOTICE_PERIODS = [
  "Can join immediately",
  "Serving notice period",
  "1 month",
  "2 months",
  "3 months",
];
function salaryRange(years: number): string {
  const low = Math.round(5 + years * 1.4);
  const high = low + Math.round(3 + years * 0.6);
  return `${low}L - ${high}L`;
}

export async function augment(prisma: PrismaClient) {
  let added = 0;

  for (let r = 0; r < ROLES.length; r++) {
    const role = ROLES[r];
    const job = await prisma.job.findFirst({ where: { title: role.jobTitle } });
    const vendor = await prisma.user.findUnique({
      where: { email: role.vendorEmail },
    });
    if (!job || !vendor) continue;

    for (let i = 0; i < SLOTS.length; i++) {
      const slot = SLOTS[i];
      const [first, last] = role.names[i];
      const rid = `RH-AUG-${r + 1}${i + 1}`; // stable, unique per role+slot
      const years = 3 + ((r + i) % 8);
      const hasResume = slot.stage !== "INCOMING";

      // Upsert candidate by rippleHireId
      let candidate = await prisma.candidate.findUnique({
        where: { rippleHireId: rid },
      });
      if (!candidate) {
        const experience = [
          {
            id: uuidv4(),
            company: role.company,
            title: role.titleWord,
            location: "Bengaluru",
            startDate: "2021-04",
            endDate: null as string | null,
            description: `Worked as a ${role.titleWord.toLowerCase()} delivering measurable results, improving key metrics by ${15 + i * 5}%.`,
          },
        ];
        const education = [
          {
            id: uuidv4(),
            institution: role.institution,
            degree: role.degree,
            field: role.field,
            startDate: "2014",
            endDate: "2018",
          },
        ];
        const cert = [{ id: uuidv4(), ...certFor(role) }];
        candidate = await prisma.candidate.create({
          data: {
            rippleHireId: rid,
            firstName: first,
            lastName: last,
            email: `${first.toLowerCase()}.${last.toLowerCase()}@email.com`,
            phone: "+91 90000 0" + String(1000 + r * 10 + i).slice(-4),
            currentTitle: role.titleWord,
            yearsOfExperience: years,
            location: "Bengaluru, India",
            noticePeriod: NOTICE_PERIODS[(r + i) % NOTICE_PERIODS.length],
            expectedSalary: salaryRange(years),
            skills: j(role.skills),
            summary: `${role.titleWord} with ${years} years of experience and a focus on ${role.field}.`,
            experience: j(experience),
            education: j(education),
            certifications: j(cert),
          },
        });
      }

      // Skip if this candidate-job already exists (idempotent)
      const existing = await prisma.candidateJob.findUnique({
        where: {
          candidateId_jobId_vendorUserId: {
            candidateId: candidate.id,
            jobId: job.id,
            vendorUserId: vendor.id,
          },
        },
      });
      if (existing) continue;

      const cj = await prisma.candidateJob.create({
        data: {
          candidateId: candidate.id,
          jobId: job.id,
          vendorUserId: vendor.id,
          stage: slot.stage,
          recruiterNotes: NOTE,
        },
      });
      added++;

      if (hasResume) {
        const profile: CandidateProfile = {
          id: candidate.id,
          rippleHireId: candidate.rippleHireId,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
          currentTitle: candidate.currentTitle,
          yearsOfExperience: candidate.yearsOfExperience,
          location: candidate.location,
          skills: role.skills,
          summary: candidate.summary,
          experience: JSON.parse(candidate.experience),
          education: JSON.parse(candidate.education),
          certifications: JSON.parse(candidate.certifications ?? "[]"),
          originalResumeUrl: null,
        };
        const content = j(buildInitialResumeContent(profile, NOTE));
        await prisma.resumeData.create({
          data: {
            candidateJobId: cj.id,
            templateId: "classic",
            accentColor: "#6B4FBB",
            fontFamily: "roboto",
            content,
            jobMatchScore: slot.jobMatch,
            qualityScore: slot.quality,
          },
        });
        await prisma.resumeVersion.create({
          data: {
            candidateJobId: cj.id,
            versionNumber: 1,
            content,
            templateId: "classic",
            accentColor: "#6B4FBB",
            fontFamily: "roboto",
            jobMatchScore: slot.jobMatch,
            qualityScore: slot.quality,
            createdBy: vendor.id,
            changeNote: "Initial resume created from candidate data",
          },
        });
      }
    }
  }

  console.log(`✅ Augment: added ${added} candidate-job entries.`);
  return added;
}

// Standalone runner
if (require.main === module) {
  const prisma = new PrismaClient();
  augment(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
