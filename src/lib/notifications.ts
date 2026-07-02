import { prisma } from "@/lib/prisma";

export type NotificationType = "COMMENT_ADDED" | "STAGE_ACCEPTED" | "STAGE_NOT_A_FIT" | "VENDOR_REPLIED";

export async function createNotification({
  recipientId,
  actorId,
  type,
  candidateJobId,
}: {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  candidateJobId: string;
}) {
  return prisma.notification.create({
    data: { recipientId, actorId, type, candidateJobId },
  });
}
