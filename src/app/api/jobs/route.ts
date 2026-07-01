import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError } from "@/lib/api";
import type { JobSummary, PipelineCounts } from "@/types/job";

// GET — jobs the current user can access, with per-stage pipeline counts.
//   Vendor: jobs their organization is assigned to.
//   Client: jobs owned by their organization.
export async function GET() {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;
    const user = auth;

    const jobs = await prisma.job.findMany({
      where:
        user.role === "VENDOR"
          ? { vendorAssignments: { some: { vendorId: user.organizationId } } }
          : { clientId: user.organizationId },
      include: { client: true },
      orderBy: { createdAt: "asc" },
    });

    const jobIds = jobs.map((j) => j.id);

    // Get pipeline counts grouped by jobId + stage, scoped to this vendor's candidates
    const pipelineRows = await prisma.candidateJob.groupBy({
      by: ["jobId", "stage"],
      where:
        user.role === "VENDOR"
          ? { jobId: { in: jobIds }, vendorUserId: user.id }
          : { jobId: { in: jobIds } },
      _count: { id: true },
    });

    // Build a map: jobId → PipelineCounts
    const countsMap = new Map<string, PipelineCounts>();
    for (const row of pipelineRows) {
      if (!countsMap.has(row.jobId)) {
        countsMap.set(row.jobId, { INCOMING: 0, PRESENTED: 0, ACCEPTED: 0, NOT_A_FIT: 0 });
      }
      const counts = countsMap.get(row.jobId)!;
      const stage = row.stage as keyof PipelineCounts;
      if (stage in counts) counts[stage] = row._count.id;
    }

    const result: JobSummary[] = jobs.map((j) => ({
      id: j.id,
      title: j.title,
      clientName: j.client.name,
      location: j.location,
      openPositions: j.openPositions,
      status: (j.status ?? "ACTIVE") as "ACTIVE" | "PAUSED",
      pipeline: countsMap.get(j.id) ?? { INCOMING: 0, PRESENTED: 0, ACCEPTED: 0, NOT_A_FIT: 0 },
    }));

    return NextResponse.json({ jobs: result });
  } catch (error) {
    return handleApiError(error);
  }
}
