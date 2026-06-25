import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const cjs = await prisma.candidateJob.findMany({
    include: {
      candidate: true,
      job: { include: { client: true } },
      resume: true,
      vendor: true,
    },
    orderBy: [{ stage: "asc" }],
  });

  console.log("\n════════════ Candidate-Job IDs for testing ════════════\n");
  console.log("Resume Builder URL pattern:");
  console.log("  /vendor/resume-builder/<candidateJobId>\n");

  const withResume = cjs.filter((c) => c.resume);
  console.log("── Entries WITH a resume (best for testing the builder) ──");
  for (const c of withResume.slice(0, 10)) {
    console.log(
      `  ${c.id}  | ${c.candidate.firstName} ${c.candidate.lastName} → ${c.job.title} @ ${c.job.client.name} | ${c.stage} | vendor: ${c.vendor.name}`
    );
  }

  const shortlisted = cjs.filter((c) => !c.resume);
  console.log(
    "\n── SHORTLISTED entries (no resume yet — builder generates from candidate data) ──"
  );
  for (const c of shortlisted.slice(0, 5)) {
    console.log(
      `  ${c.id}  | ${c.candidate.firstName} ${c.candidate.lastName} → ${c.job.title} @ ${c.job.client.name} | vendor: ${c.vendor.name}`
    );
  }

  console.log("\n── Logins (password: password123) ──");
  console.log("  vendor1@ripplehire.com (Rahul Sharma, RippleHire Staffing)");
  console.log("  vendor2@ripplehire.com (Priya Patel, HireWave Solutions)");
  console.log("  client1@acmebank.com         (Amit Verma, Acme Bank)");
  console.log("  client2@globexsecurities.com (Neha Gupta, Globex Securities)");
  console.log("\n═══════════════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
