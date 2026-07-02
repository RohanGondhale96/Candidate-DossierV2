import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser, jsonError } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;
    const user = auth;
    if (user.role !== "VENDOR") return jsonError("Forbidden", 403);

    const { candidateJobId } = await req.json();
    if (!candidateJobId) return jsonError("candidateJobId is required", 400);

    await prisma.notification.updateMany({
      where: { recipientId: user.id, candidateJobId, readAt: null },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return jsonError("Internal server error", 500);
  }
}
