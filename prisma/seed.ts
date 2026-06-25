import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { buildInitialResumeContent } from "../src/lib/resume-content";
import type { CandidateProfile } from "../src/types/candidate";
import { augment } from "./augment";

const prisma = new PrismaClient();

const j = (v: unknown) => JSON.stringify(v);

type ExpSeed = {
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string | null;
  description: string;
};
type EduSeed = {
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  description?: string;
};
type CertSeed = { name: string; issuer: string; dateObtained?: string };

type CandidateSeed = {
  rippleHireId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  currentTitle: string;
  yearsOfExperience: number;
  location: string;
  skills: string[];
  summary: string | null;
  experience: ExpSeed[];
  education: EduSeed[];
  certifications: CertSeed[];
};

const withIds = <T extends object>(arr: T[]) =>
  arr.map((x) => ({ id: uuidv4(), ...x }));

// ─── 20 candidates with varied completeness ──────────────────────────
const candidateSeeds: CandidateSeed[] = [
  // ── Complete profiles (5) ──
  {
    rippleHireId: "RH-2024-001",
    firstName: "Thomas",
    lastName: "Davis",
    email: "thomas.davis@email.com",
    phone: "+91 98765 43210",
    currentTitle: "Senior Full Stack Developer",
    yearsOfExperience: 8,
    location: "Mumbai, India",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker", "GraphQL", "Redis", "Kubernetes"],
    summary:
      "Full stack engineer with 8 years building scalable web platforms. Led teams of 5+, shipped products serving millions of users, and specialize in React/Node architectures on AWS.",
    experience: [
      { company: "TechCorp Solutions", title: "Senior Full Stack Developer", location: "Mumbai", startDate: "2021-03", endDate: null, description: "Led development of customer-facing web applications serving 2M+ users. Reduced API latency by 40% through caching and query optimization." },
      { company: "InnovateTech", title: "Full Stack Developer", location: "Pune", startDate: "2018-06", endDate: "2021-02", description: "Built and maintained microservices architecture handling 10k requests/sec. Mentored 3 junior developers." },
    ],
    education: [
      { institution: "IIT Bombay", degree: "B.Tech", field: "Computer Science", startDate: "2012", endDate: "2016" },
    ],
    certifications: [
      { name: "AWS Solutions Architect", issuer: "Amazon Web Services", dateObtained: "2023-04" },
    ],
  },
  {
    rippleHireId: "RH-2024-002",
    firstName: "Ananya",
    lastName: "Krishnan",
    email: "ananya.krishnan@email.com",
    phone: "+91 99876 54321",
    currentTitle: "Senior Product Designer",
    yearsOfExperience: 7,
    location: "Bengaluru, India",
    skills: ["Figma", "User Research", "Prototyping", "Design Systems", "Wireframing", "Usability Testing", "Interaction Design"],
    summary:
      "Product designer focused on fintech and banking experiences. I turn complex flows into intuitive interfaces and have built design systems adopted across multiple product teams.",
    experience: [
      { company: "FinDesign Studio", title: "Senior Product Designer", location: "Bengaluru", startDate: "2020-08", endDate: null, description: "Own end-to-end design for a digital banking suite. Established the company design system, cutting design-to-dev handoff time by 50%." },
      { company: "PixelWorks", title: "Product Designer", location: "Chennai", startDate: "2017-05", endDate: "2020-07", description: "Designed mobile-first experiences for e-commerce clients. Ran usability studies that lifted conversion 18%." },
    ],
    education: [
      { institution: "National Institute of Design", degree: "B.Des", field: "Interaction Design", startDate: "2013", endDate: "2017" },
    ],
    certifications: [
      { name: "Nielsen Norman UX Certification", issuer: "NN/g", dateObtained: "2022-09" },
    ],
  },
  {
    rippleHireId: "RH-2024-003",
    firstName: "Rohan",
    lastName: "Mehta",
    email: "rohan.mehta@email.com",
    phone: "+91 97654 32108",
    currentTitle: "DevOps Engineer",
    yearsOfExperience: 6,
    location: "Hyderabad, India",
    skills: ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Jenkins", "Prometheus", "Ansible", "Python"],
    summary:
      "DevOps engineer who automates everything. Built CI/CD pipelines and IaC for high-availability systems, reducing deployment time from hours to minutes.",
    experience: [
      { company: "CloudScale Systems", title: "DevOps Engineer", location: "Hyderabad", startDate: "2021-01", endDate: null, description: "Manage Kubernetes clusters across 3 regions. Implemented GitOps with Terraform, achieving 99.95% uptime." },
      { company: "DataFlow Inc", title: "Site Reliability Engineer", location: "Hyderabad", startDate: "2018-04", endDate: "2020-12", description: "Reduced incident response time 60% with Prometheus/Grafana observability stack." },
    ],
    education: [
      { institution: "BITS Pilani", degree: "B.E.", field: "Information Technology", startDate: "2012", endDate: "2016" },
    ],
    certifications: [
      { name: "Certified Kubernetes Administrator", issuer: "CNCF", dateObtained: "2022-06" },
      { name: "AWS DevOps Engineer Professional", issuer: "Amazon Web Services", dateObtained: "2023-01" },
    ],
  },
  {
    rippleHireId: "RH-2024-004",
    firstName: "Priyanka",
    lastName: "Reddy",
    email: "priyanka.reddy@email.com",
    phone: "+91 96543 21087",
    currentTitle: "Data Analyst",
    yearsOfExperience: 5,
    location: "Bengaluru, India",
    skills: ["SQL", "Python", "Tableau", "Excel", "Statistics", "Power BI", "Pandas", "Data Visualization"],
    summary:
      "Data analyst translating raw numbers into business decisions. Strong SQL and Python with a track record of dashboards that leadership actually uses.",
    experience: [
      { company: "Insight Analytics", title: "Data Analyst", location: "Bengaluru", startDate: "2020-09", endDate: null, description: "Build executive dashboards in Tableau and automate reporting with Python. Identified churn drivers that informed a retention program." },
      { company: "MarketMetrics", title: "Junior Data Analyst", location: "Bengaluru", startDate: "2019-01", endDate: "2020-08", description: "Cleaned and modeled marketing datasets; ran A/B test analyses." },
    ],
    education: [
      { institution: "Christ University", degree: "M.Sc", field: "Statistics", startDate: "2016", endDate: "2018" },
    ],
    certifications: [
      { name: "Tableau Desktop Specialist", issuer: "Tableau", dateObtained: "2021-11" },
    ],
  },
  {
    rippleHireId: "RH-2024-005",
    firstName: "Arjun",
    lastName: "Nair",
    email: "arjun.nair@email.com",
    phone: "+91 95432 10876",
    currentTitle: "Backend Engineer",
    yearsOfExperience: 9,
    location: "Pune, India",
    skills: ["Java", "Spring Boot", "Microservices", "PostgreSQL", "Redis", "Kafka", "REST APIs", "Docker"],
    summary:
      "Backend engineer specializing in high-throughput Java microservices for financial systems. Comfortable owning services end to end, from design to on-call.",
    experience: [
      { company: "SecureBank Tech", title: "Backend Engineer", location: "Pune", startDate: "2019-07", endDate: null, description: "Design payment microservices processing ₹500Cr/month. Cut p99 latency 35% with Redis caching and Kafka event streaming." },
      { company: "Enterprise Solutions Ltd", title: "Software Engineer", location: "Pune", startDate: "2015-06", endDate: "2019-06", description: "Built REST APIs for an insurance platform; led migration from monolith to microservices." },
    ],
    education: [
      { institution: "College of Engineering Pune", degree: "B.Tech", field: "Computer Engineering", startDate: "2011", endDate: "2015" },
    ],
    certifications: [
      { name: "Oracle Certified Professional, Java SE", issuer: "Oracle", dateObtained: "2020-03" },
    ],
  },

  // ── Mostly complete (10): vague or null summary, 1-2 experiences ──
  {
    rippleHireId: "RH-2024-006",
    firstName: "Sneha",
    lastName: "Iyer",
    email: "sneha.iyer@email.com",
    phone: "+91 94321 08765",
    currentTitle: "Product Designer",
    yearsOfExperience: 4,
    location: "Mumbai, India",
    skills: ["Figma", "Wireframing", "Prototyping", "User Research", "Sketch"],
    summary: "Designer passionate about clean, usable interfaces.",
    experience: [
      { company: "DesignHub", title: "Product Designer", location: "Mumbai", startDate: "2021-02", endDate: null, description: "Design web and mobile features for a SaaS product. Collaborate closely with engineering." },
      { company: "Creatives Co", title: "UI Designer", location: "Mumbai", startDate: "2019-08", endDate: "2021-01", description: "Created marketing landing pages and brand assets." },
    ],
    education: [
      { institution: "Symbiosis Institute of Design", degree: "B.Des", field: "Communication Design", startDate: "2015", endDate: "2019" },
    ],
    certifications: [],
  },
  {
    rippleHireId: "RH-2024-007",
    firstName: "Vikram",
    lastName: "Singh",
    email: "vikram.singh@email.com",
    phone: "+91 93210 87654",
    currentTitle: "Full Stack Engineer",
    yearsOfExperience: 5,
    location: "Gurgaon, India",
    skills: ["React", "Node.js", "TypeScript", "MongoDB", "Express", "AWS"],
    summary: null,
    experience: [
      { company: "WebStack Labs", title: "Full Stack Engineer", location: "Gurgaon", startDate: "2020-06", endDate: null, description: "Develop features across the stack for a logistics platform." },
      { company: "StartupXYZ", title: "Frontend Developer", location: "Delhi", startDate: "2018-07", endDate: "2020-05", description: "Built the customer dashboard in React." },
    ],
    education: [
      { institution: "Delhi Technological University", degree: "B.Tech", field: "Software Engineering", startDate: "2014", endDate: "2018" },
    ],
    certifications: [],
  },
  {
    rippleHireId: "RH-2024-008",
    firstName: "Kavya",
    lastName: "Menon",
    email: "kavya.menon@email.com",
    phone: "+91 92108 76543",
    currentTitle: "Data Analyst",
    yearsOfExperience: 3,
    location: "Kochi, India",
    skills: ["SQL", "Excel", "Power BI", "Python"],
    summary: "Detail-oriented analyst with a finance background.",
    experience: [
      { company: "FinData Corp", title: "Data Analyst", location: "Kochi", startDate: "2021-09", endDate: null, description: "Reporting and ad-hoc analysis for the finance team." },
    ],
    education: [
      { institution: "Cochin University", degree: "B.Com", field: "Finance", startDate: "2016", endDate: "2019" },
    ],
    certifications: [
      { name: "Microsoft Power BI Data Analyst", issuer: "Microsoft", dateObtained: "2022-08" },
    ],
  },
  {
    rippleHireId: "RH-2024-009",
    firstName: "Aditya",
    lastName: "Kapoor",
    email: "aditya.kapoor@email.com",
    phone: "+91 91087 65432",
    currentTitle: "DevOps Engineer",
    yearsOfExperience: 4,
    location: "Noida, India",
    skills: ["AWS", "Docker", "CI/CD", "Jenkins", "Bash"],
    summary: null,
    experience: [
      { company: "InfraOps", title: "DevOps Engineer", location: "Noida", startDate: "2021-04", endDate: null, description: "Maintain CI/CD pipelines and AWS infrastructure." },
      { company: "HostingPlus", title: "Systems Engineer", location: "Noida", startDate: "2019-06", endDate: "2021-03", description: "Server provisioning and monitoring." },
    ],
    education: [
      { institution: "Amity University", degree: "B.Tech", field: "Computer Science", startDate: "2015", endDate: "2019" },
    ],
    certifications: [],
  },
  {
    rippleHireId: "RH-2024-010",
    firstName: "Meera",
    lastName: "Joshi",
    email: "meera.joshi@email.com",
    phone: "+91 90876 54321",
    currentTitle: "Backend Engineer",
    yearsOfExperience: 6,
    location: "Pune, India",
    skills: ["Java", "Spring Boot", "MySQL", "REST APIs", "Microservices"],
    summary: "Backend developer with experience in enterprise Java applications.",
    experience: [
      { company: "Enterprise Java Co", title: "Backend Engineer", location: "Pune", startDate: "2019-03", endDate: null, description: "Develop and maintain Spring Boot services for an HR platform." },
      { company: "CodeCraft", title: "Java Developer", location: "Pune", startDate: "2017-01", endDate: "2019-02", description: "Worked on backend modules for a CRM." },
    ],
    education: [
      { institution: "VIT Pune", degree: "B.E.", field: "Computer Engineering", startDate: "2013", endDate: "2017" },
    ],
    certifications: [],
  },
  {
    rippleHireId: "RH-2024-011",
    firstName: "Karthik",
    lastName: "Subramaniam",
    email: "karthik.s@email.com",
    phone: "+91 89765 43210",
    currentTitle: "Full Stack Engineer",
    yearsOfExperience: 7,
    location: "Chennai, India",
    skills: ["React", "Node.js", "PostgreSQL", "TypeScript", "GraphQL", "Docker", "AWS"],
    summary: "Versatile engineer comfortable from database to UI.",
    experience: [
      { company: "BuildFast", title: "Senior Full Stack Engineer", location: "Chennai", startDate: "2020-02", endDate: null, description: "Lead a small product team building a B2B analytics tool." },
      { company: "TechVentures", title: "Full Stack Developer", location: "Chennai", startDate: "2016-08", endDate: "2020-01", description: "Built features for multiple client projects." },
    ],
    education: [
      { institution: "Anna University", degree: "B.E.", field: "Computer Science", startDate: "2012", endDate: "2016" },
    ],
    certifications: [],
  },
  {
    rippleHireId: "RH-2024-012",
    firstName: "Divya",
    lastName: "Pillai",
    email: "divya.pillai@email.com",
    phone: "+91 88654 32109",
    currentTitle: "Product Designer",
    yearsOfExperience: 6,
    location: "Bengaluru, India",
    skills: ["Figma", "Design Systems", "Prototyping", "User Research", "Usability Testing"],
    summary: null,
    experience: [
      { company: "ProductLab", title: "Product Designer", location: "Bengaluru", startDate: "2019-11", endDate: null, description: "Design SaaS dashboards and lead user research sessions." },
      { company: "AppStudio", title: "UX Designer", location: "Bengaluru", startDate: "2017-06", endDate: "2019-10", description: "Designed mobile app flows." },
    ],
    education: [
      { institution: "Srishti Institute of Art Design", degree: "B.Des", field: "Interaction Design", startDate: "2013", endDate: "2017" },
    ],
    certifications: [],
  },
  {
    rippleHireId: "RH-2024-013",
    firstName: "Rahul",
    lastName: "Verma",
    email: "rahul.verma2@email.com",
    phone: "+91 87543 21098",
    currentTitle: "Data Analyst",
    yearsOfExperience: 4,
    location: "Mumbai, India",
    skills: ["SQL", "Python", "Tableau", "Statistics", "Pandas"],
    summary: "Analyst who enjoys finding the story in the data.",
    experience: [
      { company: "Analytica", title: "Data Analyst", location: "Mumbai", startDate: "2020-10", endDate: null, description: "Build dashboards and predictive models for retail clients." },
    ],
    education: [
      { institution: "Mumbai University", degree: "B.Sc", field: "Mathematics", startDate: "2014", endDate: "2017" },
    ],
    certifications: [],
  },
  {
    rippleHireId: "RH-2024-014",
    firstName: "Pooja",
    lastName: "Sharma",
    email: "pooja.sharma@email.com",
    phone: "+91 86432 10987",
    currentTitle: "DevOps Engineer",
    yearsOfExperience: 5,
    location: "Bengaluru, India",
    skills: ["Kubernetes", "AWS", "Terraform", "CI/CD", "Docker", "Python"],
    summary: null,
    experience: [
      { company: "ScaleOps", title: "DevOps Engineer", location: "Bengaluru", startDate: "2020-01", endDate: null, description: "Own the Kubernetes platform and IaC for a SaaS company." },
      { company: "CloudFirst", title: "Cloud Engineer", location: "Bengaluru", startDate: "2018-03", endDate: "2019-12", description: "AWS infrastructure and automation." },
    ],
    education: [
      { institution: "RV College of Engineering", degree: "B.E.", field: "Information Science", startDate: "2014", endDate: "2018" },
    ],
    certifications: [
      { name: "AWS Certified Solutions Architect", issuer: "Amazon Web Services", dateObtained: "2021-07" },
    ],
  },
  {
    rippleHireId: "RH-2024-015",
    firstName: "Sanjay",
    lastName: "Gupta",
    email: "sanjay.gupta@email.com",
    phone: "+91 85321 09876",
    currentTitle: "Backend Engineer",
    yearsOfExperience: 8,
    location: "Hyderabad, India",
    skills: ["Java", "Spring Boot", "Kafka", "PostgreSQL", "Redis", "Microservices"],
    summary: "Experienced backend engineer with a focus on distributed systems.",
    experience: [
      { company: "DistSys Tech", title: "Senior Backend Engineer", location: "Hyderabad", startDate: "2018-09", endDate: null, description: "Architect event-driven microservices with Kafka for a trading platform." },
      { company: "FinServe", title: "Backend Engineer", location: "Hyderabad", startDate: "2015-07", endDate: "2018-08", description: "Built core banking APIs." },
    ],
    education: [
      { institution: "IIIT Hyderabad", degree: "B.Tech", field: "Computer Science", startDate: "2011", endDate: "2015" },
    ],
    certifications: [],
  },

  // ── Sparse profiles (5): no summary, short single experience, no certs ──
  {
    rippleHireId: "RH-2024-016",
    firstName: "Neha",
    lastName: "Agarwal",
    email: "neha.agarwal@email.com",
    phone: "+91 84210 98765",
    currentTitle: "Junior Product Designer",
    yearsOfExperience: 2,
    location: "Jaipur, India",
    skills: ["Figma", "Wireframing"],
    summary: null,
    experience: [
      { company: "Design Start", title: "Junior Product Designer", location: "Jaipur", startDate: "2022-07", endDate: null, description: "Assist with UI design tasks." },
    ],
    education: [
      { institution: "JECRC University", degree: "B.Des", field: "Design", startDate: "2018", endDate: "2022" },
    ],
    certifications: [],
  },
  {
    rippleHireId: "RH-2024-017",
    firstName: "Amit",
    lastName: "Patel",
    email: "amit.patel2@email.com",
    phone: "+91 83109 87654",
    currentTitle: "Junior Full Stack Developer",
    yearsOfExperience: 1,
    location: "Ahmedabad, India",
    skills: ["React", "Node.js", "JavaScript"],
    summary: null,
    experience: [
      { company: "DevShop", title: "Junior Developer", location: "Ahmedabad", startDate: "2023-06", endDate: null, description: "Work on web app features." },
    ],
    education: [
      { institution: "Nirma University", degree: "B.Tech", field: "Computer Science", startDate: "2019", endDate: "2023" },
    ],
    certifications: [],
  },
  {
    rippleHireId: "RH-2024-018",
    firstName: "Ritu",
    lastName: "Desai",
    email: "ritu.desai@email.com",
    phone: "+91 82098 76543",
    currentTitle: "Junior Data Analyst",
    yearsOfExperience: 2,
    location: "Surat, India",
    skills: ["SQL", "Excel"],
    summary: null,
    experience: [
      { company: "DataStart", title: "Junior Data Analyst", location: "Surat", startDate: "2022-08", endDate: null, description: "Prepare reports." },
    ],
    education: [
      { institution: "Gujarat University", degree: "B.Sc", field: "Statistics", startDate: "2018", endDate: "2021" },
    ],
    certifications: [],
  },
  {
    rippleHireId: "RH-2024-019",
    firstName: "Suresh",
    lastName: "Kumar",
    email: "suresh.kumar@email.com",
    phone: "+91 81087 65432",
    currentTitle: "Junior DevOps Engineer",
    yearsOfExperience: 2,
    location: "Coimbatore, India",
    skills: ["Docker", "AWS", "Linux"],
    summary: null,
    experience: [
      { company: "OpsStart", title: "Junior DevOps Engineer", location: "Coimbatore", startDate: "2022-09", endDate: null, description: "Help maintain deployments." },
    ],
    education: [
      { institution: "PSG College of Technology", degree: "B.E.", field: "Information Technology", startDate: "2018", endDate: "2022" },
    ],
    certifications: [],
  },
  {
    rippleHireId: "RH-2024-020",
    firstName: "Lakshmi",
    lastName: "Rao",
    email: "lakshmi.rao@email.com",
    phone: "+91 80976 54321",
    currentTitle: "Junior Backend Engineer",
    yearsOfExperience: 1,
    location: "Visakhapatnam, India",
    skills: ["Java", "Spring Boot"],
    summary: null,
    experience: [
      { company: "BackendStart", title: "Junior Backend Engineer", location: "Visakhapatnam", startDate: "2023-07", endDate: null, description: "Develop API endpoints." },
    ],
    education: [
      { institution: "Andhra University", degree: "B.Tech", field: "Computer Science", startDate: "2019", endDate: "2023" },
    ],
    certifications: [],
  },
];

// Guarantee every candidate has at least the minimum demo data a client expects
// to see: a summary, a few skills, and at least one certification. (Experience
// and education are already present for every seed above.) Variations come from
// each candidate's own title / years / location / role.
type RoleKind = "design" | "data" | "devops" | "backend" | "fullstack";
function roleKind(title: string): RoleKind {
  const t = title.toLowerCase();
  if (t.includes("design")) return "design";
  if (t.includes("data")) return "data";
  if (t.includes("devops")) return "devops";
  if (t.includes("backend")) return "backend";
  return "fullstack";
}
const CERT_BY_KIND: Record<RoleKind, CertSeed> = {
  design: { name: "Google UX Design Certificate", issuer: "Google", dateObtained: "2022-05" },
  data: { name: "Microsoft Power BI Data Analyst", issuer: "Microsoft", dateObtained: "2022-08" },
  devops: { name: "AWS Certified Solutions Architect", issuer: "Amazon Web Services", dateObtained: "2022-06" },
  backend: { name: "Oracle Certified Professional, Java SE", issuer: "Oracle", dateObtained: "2022-03" },
  fullstack: { name: "Meta Full-Stack Developer", issuer: "Meta", dateObtained: "2022-10" },
};
const SKILL_POOL_BY_KIND: Record<RoleKind, string[]> = {
  design: ["Prototyping", "User Research", "Design Systems", "Usability Testing"],
  data: ["Data Visualization", "Statistics", "Power BI", "Pandas"],
  devops: ["Docker", "CI/CD", "Terraform", "Linux"],
  backend: ["REST APIs", "SQL", "Microservices", "Docker"],
  fullstack: ["React", "Node.js", "TypeScript", "AWS"],
};
function ensureMinimum(c: CandidateSeed): CandidateSeed {
  const kind = roleKind(c.currentTitle);
  const skills = [...c.skills];
  for (const s of SKILL_POOL_BY_KIND[kind]) {
    if (skills.length >= 4) break;
    if (!skills.includes(s)) skills.push(s);
  }
  const city = c.location.split(",")[0];
  return {
    ...c,
    skills,
    summary:
      c.summary && c.summary.trim()
        ? c.summary
        : `${c.currentTitle} with ${c.yearsOfExperience} years of experience, delivering reliable, high-quality work. Based in ${city} and quick to ramp on new domains.`,
    certifications: c.certifications.length
      ? c.certifications
      : [CERT_BY_KIND[kind]],
  };
}
const normalizedSeeds: CandidateSeed[] = candidateSeeds.map(ensureMinimum);

// Deterministic dummy notice period + expected salary per candidate.
const NOTICE_PERIODS = [
  "Immediate",
  "Within 15 days",
  "Within 30 days",
  "30–60 days",
  "Serving notice (90 days)",
];
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function noticeFor(c: CandidateSeed): string {
  return NOTICE_PERIODS[hashStr(c.rippleHireId) % NOTICE_PERIODS.length];
}
function salaryFor(c: CandidateSeed): string {
  const y = c.yearsOfExperience;
  const low = Math.round(5 + y * 1.4);
  const high = low + Math.round(3 + y * 0.6);
  return `${low}L - ${high}L`;
}

const RECRUITER_NOTES = [
  "Strong technical match for this role. Has directly relevant experience and ramps up quickly. Highly recommend an early conversation.",
  "Great culture fit and a clear communicator. Skills map closely to the requirements; would be a reliable contributor from day one.",
  "Standout candidate — proven impact at scale and leadership potential. Worth prioritizing.",
  "Solid all-rounder. Slightly less senior than the JD asks but a fast learner with the right fundamentals.",
  "Excellent domain experience for this client. Comes well-recommended by previous managers.",
];

async function main() {
  console.log("🌱 Seeding Candidate Dossier...");

  // Clean slate (dependency order)
  await prisma.comment.deleteMany();
  await prisma.resumeVersion.deleteMany();
  await prisma.resumeData.deleteMany();
  await prisma.candidateJob.deleteMany();
  await prisma.vendorJobAssignment.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // ── Organizations ──
  const talentbird = await prisma.organization.create({
    data: { name: "RippleHire Staffing", type: "VENDOR" },
  });
  const hirewave = await prisma.organization.create({
    data: { name: "HireWave Solutions", type: "VENDOR" },
  });
  const axis = await prisma.organization.create({
    data: { name: "Acme Bank", type: "CLIENT" },
  });
  const hdfc = await prisma.organization.create({
    data: { name: "Globex Securities", type: "CLIENT" },
  });

  // ── Users (password123 for all) ──
  const passwordHash = await bcrypt.hash("password123", 10);
  const vendor1 = await prisma.user.create({
    data: { email: "vendor1@ripplehire.com", name: "Rahul Sharma", passwordHash, role: "VENDOR", organizationId: talentbird.id },
  });
  const vendor2 = await prisma.user.create({
    data: { email: "vendor2@ripplehire.com", name: "Priya Patel", passwordHash, role: "VENDOR", organizationId: hirewave.id },
  });
  const client1 = await prisma.user.create({
    data: { email: "client1@acmebank.com", name: "Amit Verma", passwordHash, role: "CLIENT", organizationId: axis.id },
  });
  const client2 = await prisma.user.create({
    data: { email: "client2@globexsecurities.com", name: "Neha Gupta", passwordHash, role: "CLIENT", organizationId: hdfc.id },
  });

  // ── Jobs ──
  const job1 = await prisma.job.create({
    data: { title: "Senior Product Designer", description: "Design intuitive banking experiences for Acme Bank's digital products.", requirements: "5+ years product design, fintech experience preferred, strong portfolio, design systems expertise.", requiredSkills: j(["Figma", "User Research", "Prototyping", "Design Systems", "Wireframing"]), location: "Bengaluru", salaryRange: "₹25-35 LPA", openPositions: 3, clientId: axis.id },
  });
  const job2 = await prisma.job.create({
    data: { title: "Full Stack Engineer", description: "Build and scale Acme Bank's customer-facing web platforms.", requirements: "4+ years full stack, React + Node, cloud experience, strong CS fundamentals.", requiredSkills: j(["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"]), location: "Bengaluru", salaryRange: "₹20-30 LPA", openPositions: 5, clientId: axis.id },
  });
  const job3 = await prisma.job.create({
    data: { title: "Data Analyst", description: "Turn data into decisions for Acme Bank's risk and growth teams.", requirements: "3+ years analytics, strong SQL and Python, BI tools, statistics background.", requiredSkills: j(["SQL", "Python", "Tableau", "Excel", "Statistics"]), location: "Mumbai", salaryRange: "₹12-18 LPA", openPositions: 2, clientId: axis.id },
  });
  const job4 = await prisma.job.create({
    data: { title: "DevOps Engineer", description: "Own the cloud infrastructure for Globex Securities' trading platforms.", requirements: "4+ years DevOps, Kubernetes, AWS, IaC, strong automation mindset.", requiredSkills: j(["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform"]), location: "Hyderabad", salaryRange: "₹22-32 LPA", openPositions: 3, clientId: hdfc.id },
  });
  const job5 = await prisma.job.create({
    data: { title: "Backend Engineer", description: "Build high-throughput backend services for Globex Securities.", requirements: "4+ years backend, Java + Spring Boot, microservices, messaging systems.", requiredSkills: j(["Java", "Spring Boot", "Microservices", "PostgreSQL", "Redis"]), location: "Pune", salaryRange: "₹20-30 LPA", openPositions: 4, clientId: hdfc.id },
  });

  // ── Vendor ↔ Job assignments ──
  // TalentBird → jobs 1, 2, 4 ; HireWave → jobs 2, 3, 5
  await prisma.vendorJobAssignment.createMany({
    data: [
      { vendorId: talentbird.id, jobId: job1.id },
      { vendorId: talentbird.id, jobId: job2.id },
      { vendorId: talentbird.id, jobId: job4.id },
      { vendorId: hirewave.id, jobId: job2.id },
      { vendorId: hirewave.id, jobId: job3.id },
      { vendorId: hirewave.id, jobId: job5.id },
    ],
  });

  // ── Candidates ──
  type CandidateEntry = {
    created: Awaited<ReturnType<typeof prisma.candidate.create>>;
    seed: CandidateSeed;
    exp: ({ id: string } & ExpSeed)[];
    edu: ({ id: string } & EduSeed)[];
    cert: ({ id: string } & CertSeed)[];
  };
  const candidates: CandidateEntry[] = [];
  for (const c of normalizedSeeds) {
    const exp = withIds(c.experience);
    const edu = withIds(c.education);
    const cert = withIds(c.certifications);
    const created = await prisma.candidate.create({
      data: {
        rippleHireId: c.rippleHireId,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        currentTitle: c.currentTitle,
        yearsOfExperience: c.yearsOfExperience,
        location: c.location,
        noticePeriod: noticeFor(c),
        expectedSalary: salaryFor(c),
        skills: j(c.skills),
        summary: c.summary,
        experience: j(exp),
        education: j(edu),
        certifications: cert.length ? j(cert) : null,
      },
    });
    candidates.push({ created, seed: c, exp, edu, cert });
  }

  // Helper to build a CandidateProfile for resume content generation
  const toProfile = (entry: (typeof candidates)[number]): CandidateProfile => ({
    id: entry.created.id,
    rippleHireId: entry.seed.rippleHireId,
    firstName: entry.seed.firstName,
    lastName: entry.seed.lastName,
    email: entry.seed.email,
    phone: entry.seed.phone,
    currentTitle: entry.seed.currentTitle,
    yearsOfExperience: entry.seed.yearsOfExperience,
    location: entry.seed.location,
    skills: entry.seed.skills,
    summary: entry.seed.summary,
    experience: entry.exp,
    education: entry.edu,
    certifications: entry.cert,
    originalResumeUrl: null,
  });

  // ── Candidate-Job pipeline entries ──
  // Each tuple: [candidate index, jobId, vendorUserId, stage, rejectedAtStage?, scores?]
  type Stage =
    | "SHORTLISTED"
    | "IN_REVIEW"
    | "REVIEW_ACCEPTED"
    | "SCHEDULED_INTERVIEW"
    | "PENDING_FEEDBACK"
    | "ACCEPTED"
    | "REJECTED";

  type CJ = {
    ci: number;
    job: { id: string; clientId: string; title: string };
    vendorId: string;
    stage: Stage;
    rejectedAtStage?: Stage;
    jobMatch?: number;
    quality?: number;
    clientUserId?: string;
  };

  const cjs: CJ[] = [
    // ── SHORTLISTED (8) — no resume yet ──
    { ci: 0, job: job2, vendorId: vendor1.id, stage: "SHORTLISTED" },
    { ci: 6, job: job2, vendorId: vendor2.id, stage: "SHORTLISTED" },
    { ci: 1, job: job1, vendorId: vendor1.id, stage: "SHORTLISTED" },
    { ci: 5, job: job1, vendorId: vendor1.id, stage: "SHORTLISTED" },
    { ci: 3, job: job3, vendorId: vendor2.id, stage: "SHORTLISTED" },
    { ci: 4, job: job5, vendorId: vendor2.id, stage: "SHORTLISTED" },
    { ci: 16, job: job2, vendorId: vendor1.id, stage: "SHORTLISTED" },
    { ci: 18, job: job4, vendorId: vendor1.id, stage: "SHORTLISTED" },

    // ── IN_REVIEW (5) — resume built & sent ──
    { ci: 2, job: job4, vendorId: vendor1.id, stage: "IN_REVIEW", jobMatch: 82, quality: 74, clientUserId: client2.id },
    { ci: 10, job: job2, vendorId: vendor1.id, stage: "IN_REVIEW", jobMatch: 76, quality: 68, clientUserId: client1.id },
    { ci: 11, job: job1, vendorId: vendor1.id, stage: "IN_REVIEW", jobMatch: 71, quality: 65, clientUserId: client1.id },
    { ci: 12, job: job3, vendorId: vendor2.id, stage: "IN_REVIEW", jobMatch: 69, quality: 70, clientUserId: client1.id },
    { ci: 14, job: job5, vendorId: vendor2.id, stage: "IN_REVIEW", jobMatch: 80, quality: 72, clientUserId: client2.id },

    // ── REVIEW_ACCEPTED (4) — client accepted the profile ──
    { ci: 1, job: job2, vendorId: vendor1.id, stage: "REVIEW_ACCEPTED", jobMatch: 73, quality: 78, clientUserId: client1.id },
    { ci: 9, job: job5, vendorId: vendor2.id, stage: "REVIEW_ACCEPTED", jobMatch: 84, quality: 75, clientUserId: client2.id },
    { ci: 13, job: job3, vendorId: vendor2.id, stage: "REVIEW_ACCEPTED", jobMatch: 77, quality: 71, clientUserId: client1.id },
    { ci: 0, job: job4, vendorId: vendor1.id, stage: "REVIEW_ACCEPTED", jobMatch: 70, quality: 80, clientUserId: client2.id },

    // ── SCHEDULED_INTERVIEW (3) ──
    { ci: 4, job: job4, vendorId: vendor1.id, stage: "SCHEDULED_INTERVIEW", jobMatch: 79, quality: 76, clientUserId: client2.id },
    { ci: 7, job: job2, vendorId: vendor2.id, stage: "SCHEDULED_INTERVIEW", jobMatch: 68, quality: 64, clientUserId: client1.id },
    { ci: 8, job: job3, vendorId: vendor2.id, stage: "SCHEDULED_INTERVIEW", jobMatch: 66, quality: 62, clientUserId: client1.id },

    // ── PENDING_FEEDBACK (2) — interview done, awaiting feedback ──
    { ci: 5, job: job2, vendorId: vendor1.id, stage: "PENDING_FEEDBACK", jobMatch: 72, quality: 69, clientUserId: client1.id },
    { ci: 15, job: job5, vendorId: vendor2.id, stage: "PENDING_FEEDBACK", jobMatch: 85, quality: 79, clientUserId: client2.id },

    // ── ACCEPTED (2) — hired ──
    { ci: 2, job: job1, vendorId: vendor1.id, stage: "ACCEPTED", jobMatch: 60, quality: 73, clientUserId: client1.id },
    { ci: 3, job: job2, vendorId: vendor2.id, stage: "ACCEPTED", jobMatch: 74, quality: 77, clientUserId: client1.id },

    // ── REJECTED (4): 2 from In Review, 2 from Pending Feedback ──
    { ci: 17, job: job2, vendorId: vendor1.id, stage: "REJECTED", rejectedAtStage: "IN_REVIEW", jobMatch: 45, quality: 50, clientUserId: client1.id },
    { ci: 19, job: job5, vendorId: vendor2.id, stage: "REJECTED", rejectedAtStage: "IN_REVIEW", jobMatch: 48, quality: 52, clientUserId: client2.id },
    { ci: 18, job: job3, vendorId: vendor2.id, stage: "REJECTED", rejectedAtStage: "PENDING_FEEDBACK", jobMatch: 63, quality: 60, clientUserId: client1.id },
    { ci: 7, job: job4, vendorId: vendor1.id, stage: "REJECTED", rejectedAtStage: "PENDING_FEEDBACK", jobMatch: 58, quality: 61, clientUserId: client2.id },
  ];

  let resumeCount = 0;
  let cjCount = 0;
  for (let i = 0; i < cjs.length; i++) {
    const cj = cjs[i];
    const entry = candidates[cj.ci];
    const noteText = RECRUITER_NOTES[i % RECRUITER_NOTES.length];
    const hasResume = cj.stage !== "SHORTLISTED";

    const created = await prisma.candidateJob.create({
      data: {
        candidateId: entry.created.id,
        jobId: cj.job.id,
        vendorUserId: cj.vendorId,
        stage: cj.stage,
        rejectedAtStage: cj.rejectedAtStage ?? null,
        recruiterNotes: noteText,
      },
    });
    cjCount++;

    if (hasResume) {
      const content = buildInitialResumeContent(toProfile(entry), noteText);
      const contentStr = j(content);
      await prisma.resumeData.create({
        data: {
          candidateJobId: created.id,
          templateId: "classic",
          accentColor: "#6B4FBB",
          content: contentStr,
          jobMatchScore: cj.jobMatch ?? null,
          qualityScore: cj.quality ?? null,
        },
      });
      await prisma.resumeVersion.create({
        data: {
          candidateJobId: created.id,
          versionNumber: 1,
          content: contentStr,
          templateId: "classic",
          accentColor: "#6B4FBB",
          jobMatchScore: cj.jobMatch ?? null,
          qualityScore: cj.quality ?? null,
          createdBy: cj.vendorId,
          changeNote: "Initial resume created from candidate data",
        },
      });
      resumeCount++;

      // A client comment on a couple of reviewed candidates
      if (
        cj.clientUserId &&
        (cj.stage === "IN_REVIEW" ||
          cj.stage === "REVIEW_ACCEPTED" ||
          cj.stage === "ACCEPTED")
      ) {
        if (i % 3 === 0) {
          await prisma.comment.create({
            data: {
              candidateJobId: created.id,
              userId: cj.clientUserId,
              content:
                "Good profile overall. Could you confirm their hands-on experience with our core stack before we proceed?",
            },
          });
        }
      }
    }
  }

  console.log(`✅ Seed complete:`);
  console.log(`   4 organizations, 4 users, 5 jobs, 6 vendor assignments`);
  console.log(`   ${candidates.length} candidates`);
  console.log(`   ${cjCount} candidate-job pipeline entries`);
  console.log(`   ${resumeCount} resumes (+ versions)`);

  // Extra demo candidates (2 shortlisted + 1 pending + 2 accepted per job)
  await augment(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
