# Vendor Notification System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Notify the vendor/recruiter whenever a client takes any action on a candidate — comment posted, candidate accepted, or candidate marked as not a fit.

**Architecture:** Add a `Notification` table as the single source of truth for the bell. Notification rows are written at the event source (comment POST, stage PATCH) and read by the bell. Mark-read is a single endpoint that clears all notifications for a given candidateJobId when the vendor opens the drawer.

**Tech Stack:** Prisma 5 + PostgreSQL (Neon), Next.js 14 App Router, TypeScript, Tailwind, shadcn

---

### Task 1: Add Notification model to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

Add the Notification model and update relations on User and CandidateJob:

```prisma
model Notification {
  id             String       @id @default(cuid())
  recipientId    String
  recipient      User         @relation("ReceivedNotifications", fields: [recipientId], references: [id])
  actorId        String
  actor          User         @relation("SentNotifications", fields: [actorId], references: [id])
  type           String       // "COMMENT_ADDED" | "STAGE_ACCEPTED" | "STAGE_NOT_A_FIT"
  candidateJobId String
  candidateJob   CandidateJob @relation(fields: [candidateJobId], references: [id])
  readAt         DateTime?
  createdAt      DateTime     @default(now())

  @@index([recipientId, readAt])
  @@index([candidateJobId])
}
```

Also add to User model:
```prisma
receivedNotifications Notification[] @relation("ReceivedNotifications")
sentNotifications     Notification[] @relation("SentNotifications")
```

Also add to CandidateJob model:
```prisma
notifications Notification[]
```

Run: `npx prisma db push --skip-generate`

---

### Task 2: Create notification helper

**Files:**
- Create: `src/lib/notifications.ts`

```ts
import { prisma } from "@/lib/prisma";

export type NotificationType = "COMMENT_ADDED" | "STAGE_ACCEPTED" | "STAGE_NOT_A_FIT";

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
```

---

### Task 3: Fire COMMENT_ADDED notification when client posts a comment

**Files:**
- Modify: `src/app/api/comments/route.ts`

After `prisma.comment.create(...)`, if the actor is a CLIENT, create a notification for the vendor:

```ts
import { createNotification } from "@/lib/notifications";

// After comment is created, inside the try block:
if (user.role === "CLIENT") {
  const cj = await prisma.candidateJob.findUnique({
    where: { id: candidateJobId },
    select: { vendorUserId: true },
  });
  if (cj) {
    await createNotification({
      recipientId: cj.vendorUserId,
      actorId: user.id,
      type: "COMMENT_ADDED",
      candidateJobId,
    }).catch(() => {}); // non-blocking
  }
}
```

---

### Task 4: Fire STAGE_ACCEPTED / STAGE_NOT_A_FIT when client moves a candidate

**Files:**
- Modify: `src/app/api/candidate-jobs/[candidateJobId]/route.ts`

After `prisma.candidateJob.update(...)`, if the actor is a CLIENT and the new stage is ACCEPTED or NOT_A_FIT:

```ts
import { createNotification } from "@/lib/notifications";

// After the update, inside the try block:
if (
  user.role === "CLIENT" &&
  (newStage === "ACCEPTED" || newStage === "NOT_A_FIT")
) {
  const notifType = newStage === "ACCEPTED" ? "STAGE_ACCEPTED" : "STAGE_NOT_A_FIT";
  await createNotification({
    recipientId: cj.vendorUserId,
    actorId: user.id,
    type: notifType,
    candidateJobId: cj.id,
  }).catch(() => {});
}
```

---

### Task 5: Rewrite GET /api/notifications to use Notification table

**Files:**
- Modify: `src/app/api/notifications/route.ts`

Replace the entire handler with a query against the Notification table:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, jsonError } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const auth = await requireUser();
    if (auth instanceof NextResponse) return auth;
    const user = auth;
    if (user.role !== "VENDOR") return jsonError("Forbidden", 403);

    const { searchParams } = new URL(req.url);
    const filterCandidateJobId = searchParams.get("candidateJobId");

    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: user.id,
        readAt: null,
        ...(filterCandidateJobId ? { candidateJobId: filterCandidateJobId } : {}),
      },
      include: {
        candidateJob: { include: { candidate: true, job: true } },
        actor: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const items = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      candidateJobId: n.candidateJobId,
      candidateName: `${n.candidateJob.candidate.firstName} ${n.candidateJob.candidate.lastName}`,
      jobTitle: n.candidateJob.job.title,
      actorName: n.actor.name,
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({ total: items.length, items });
  } catch (e) {
    console.error(e);
    return jsonError("Internal server error", 500);
  }
}
```

---

### Task 6: Add POST /api/notifications/mark-read endpoint

**Files:**
- Create: `src/app/api/notifications/mark-read/route.ts`

Marks all unread notifications for a candidateJobId as read:

```ts
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
```

---

### Task 7: Update CandidateDetailDrawer to use new notification system

**Files:**
- Modify: `src/components/kanban/CandidateDetailDrawer.tsx`

In the useEffect that fetches notifications on drawer open:
- Count COMMENT_ADDED items for the unread dot
- POST mark-read immediately to clear the bell badge

```ts
useEffect(() => {
  if (!open || !card) return;
  fetch(`/api/notifications?candidateJobId=${card.candidateJobId}`)
    .then((r) => r.json())
    .then((d) => {
      const commentCount = (d.items ?? []).filter(
        (i: { type: string }) => i.type === "COMMENT_ADDED"
      ).length;
      setUnreadCount(commentCount);
      // Mark all notifications for this candidate as read (clears bell)
      fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateJobId: card.candidateJobId }),
      }).catch(() => {});
    })
    .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [open, card]);
```

Remove the existing mark-comments-read call from this effect (it's now handled in handleTabChange only).

---

### Task 8: Update VendorNotificationBell for type-specific display

**Files:**
- Modify: `src/components/layout/VendorNotificationBell.tsx`

Update the `NotificationItem` interface and the item rendering to show type-specific icons and copy:

```ts
interface NotificationItem {
  id: string;
  type: "COMMENT_ADDED" | "STAGE_ACCEPTED" | "STAGE_NOT_A_FIT";
  candidateJobId: string;
  candidateName: string;
  jobTitle: string;
  actorName: string;
  createdAt: string;
}
```

Per-type display:
- `COMMENT_ADDED` → MessageSquare icon (blue), body: `New comment from {actorName}`
- `STAGE_ACCEPTED` → CheckCircle2 icon (green), body: `Accepted by {actorName}`
- `STAGE_NOT_A_FIT` → XCircle icon (orange/red), body: `Marked not a fit by {actorName}`

Each item navigates to `/vendor/candidates?openCard={candidateJobId}` (same as now).

---

### Task 9: Seed Notification rows for existing data

**Files:**
- Modify: `prisma/seed.ts`

After each CandidateJob is created (inside the for loop), seed notifications for non-INCOMING stages. The "actor" is the client assigned to that job, and the "recipient" is the vendor:

```ts
// After comment seeding block, still inside if (hasResume):
if (cj.clientUserId) {
  if (cj.stage === "ACCEPTED") {
    await prisma.notification.create({
      data: {
        recipientId: cj.vendorId,
        actorId: cj.clientUserId,
        type: "STAGE_ACCEPTED",
        candidateJobId: created.id,
      },
    });
  } else if (cj.stage === "NOT_A_FIT" && cj.clientUserId) {
    await prisma.notification.create({
      data: {
        recipientId: cj.vendorId,
        actorId: cj.clientUserId,
        type: "STAGE_NOT_A_FIT",
        candidateJobId: created.id,
      },
    });
  } else if (cj.stage === "PRESENTED") {
    // Seed a COMMENT_ADDED notification (matches the comment we created above)
    await prisma.notification.create({
      data: {
        recipientId: cj.vendorId,
        actorId: cj.clientUserId,
        type: "COMMENT_ADDED",
        candidateJobId: created.id,
      },
    });
  }
}
```

Run: `npx prisma db seed`

---

### Task 10: Commit and push

```bash
git add prisma/schema.prisma src/lib/notifications.ts \
  src/app/api/comments/route.ts \
  src/app/api/candidate-jobs/[candidateJobId]/route.ts \
  src/app/api/notifications/route.ts \
  src/app/api/notifications/mark-read/route.ts \
  src/components/kanban/CandidateDetailDrawer.tsx \
  src/components/layout/VendorNotificationBell.tsx \
  prisma/seed.ts
git commit -m "PRD-7847 Add multi-type vendor notification system

Workflow: rh-assist"
git push origin main
```
