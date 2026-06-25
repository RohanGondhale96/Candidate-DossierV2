import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser, jsonError, handleApiError } from "@/lib/api";

// Both the assigned vendor and the job's client may read & post comments on a
// candidate-job (a two-way feedback thread).
async function authorize(candidateJobId: string, user: {
  id: string;
  role: string;
  organizationId: string;
}) {
  const cj = await prisma.candidateJob.findUnique({
    where: { id: candidateJobId },
    include: { job: { select: { clientId: true } } },
  });
  if (!cj) return { ok: false as const, status: 404, error: "Not found" };
  const allowed =
    user.role === "VENDOR"
      ? cj.vendorUserId === user.id
      : cj.job.clientId === user.organizationId;
  if (!allowed) return { ok: false as const, status: 403, error: "Forbidden" };
  return { ok: true as const };
}

// GET /api/comments?candidateJobId=X
export async function GET(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;
    const user = auth;

    const candidateJobId = req.nextUrl.searchParams.get("candidateJobId");
    if (!candidateJobId) return jsonError("candidateJobId is required", 400);

    const access = await authorize(candidateJobId, user);
    if (!access.ok) return jsonError(access.error, access.status);

    const comments = await prisma.comment.findMany({
      where: { candidateJobId },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true, role: true } } },
    });

    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id,
        content: c.content,
        authorName: c.user.name,
        authorRole: c.user.role,
        isMine: c.userId === user.id,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

const postSchema = z.object({
  candidateJobId: z.string().min(1),
  content: z.string().trim().min(1).max(2000),
});

// POST /api/comments
export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;
    const user = auth;

    const { candidateJobId, content } = postSchema.parse(await req.json());

    const access = await authorize(candidateJobId, user);
    if (!access.ok) return jsonError(access.error, access.status);

    const comment = await prisma.comment.create({
      data: { candidateJobId, userId: user.id, content },
      include: { user: { select: { name: true, role: true } } },
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        content: comment.content,
        authorName: comment.user.name,
        authorRole: comment.user.role,
        isMine: true,
        createdAt: comment.createdAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
