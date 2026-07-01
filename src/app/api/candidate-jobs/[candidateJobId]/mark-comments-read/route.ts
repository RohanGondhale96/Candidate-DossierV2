import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser, jsonError } from "@/lib/api";

export async function POST(
  _req: Request,
  { params }: { params: { candidateJobId: string } }
) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;
    const user = auth;
    if (user.role !== "VENDOR") return jsonError("Forbidden", 403);

    const cj = await prisma.candidateJob.findUnique({
      where: { id: params.candidateJobId },
    });
    if (!cj || cj.vendorUserId !== user.id) return jsonError("Not found", 404);

    await prisma.candidateJob.update({
      where: { id: params.candidateJobId },
      data: { vendorLastReadAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return jsonError("Internal server error", 500);
  }
}
