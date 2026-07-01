import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser, jsonError, handleApiError } from "@/lib/api";

const bodySchema = z.object({
  candidateJobIds: z.array(z.string()).min(1).max(20),
});

// Generic demo notes — rotated across candidates so each gets a distinct pitch.
const DEMO_NOTES = [
  "Strong communicator with a proven track record of delivering results in fast-paced environments. Their technical depth combined with cross-functional collaboration skills makes them an excellent fit for the team. They come highly recommended by their previous managers.",
  "Brings a rare blend of strategic thinking and hands-on execution to every role they take on. Has consistently exceeded performance targets and shown a strong ability to mentor junior team members. Would integrate well with the client's culture.",
  "Demonstrates exceptional problem-solving ability and a proactive attitude toward ownership. Their background aligns closely with the core requirements of this role, and they are available to join with minimal notice. A strong candidate worth prioritising.",
  "Has a solid foundation in the key skills required for this position, backed by relevant industry experience. Known for being highly adaptable and quick to ramp up in new environments. Their communication style would resonate well with the client's team.",
  "Brings enthusiasm, technical competence, and a growth mindset that stands out in our process. Has worked in similar domains and understands the nuances of the client's industry well. We believe they would add immediate value from day one.",
  "A well-rounded professional who combines deep domain expertise with strong stakeholder management skills. Their past experience closely mirrors what the client is looking for, and they have expressed strong interest in the opportunity. Highly recommended.",
];

// POST — generate per-candidate summaries for the same job (demo: generic notes).
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser("VENDOR");
    if (auth instanceof NextResponse) return auth;
    const user = auth;

    const { candidateJobIds } = bodySchema.parse(await req.json());

    const candidateJobs = await prisma.candidateJob.findMany({
      where: { id: { in: candidateJobIds }, vendorUserId: user.id },
      include: { candidate: true, job: true },
    });

    if (candidateJobs.length === 0) return jsonError("Not found", 404);

    const jobIds = new Set(candidateJobs.map((cj) => cj.jobId));
    if (jobIds.size > 1)
      return jsonError("All candidates must be for the same job", 400);

    const summaries = candidateJobs.map((cj, i) => ({
      candidateJobId: cj.id,
      summary: DEMO_NOTES[i % DEMO_NOTES.length],
    }));

    return NextResponse.json({ summaries });
  } catch (error) {
    return handleApiError(error);
  }
}
