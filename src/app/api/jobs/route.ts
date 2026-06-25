import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError } from "@/lib/api";
import type { JobSummary } from "@/types/job";

// GET — jobs the current user can access.
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

    const result: JobSummary[] = jobs.map((j) => ({
      id: j.id,
      title: j.title,
      clientName: j.client.name,
      location: j.location,
      openPositions: j.openPositions,
    }));

    return NextResponse.json({ jobs: result });
  } catch (error) {
    return handleApiError(error);
  }
}
