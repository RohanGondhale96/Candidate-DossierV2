"use client";

import { NotificationBell } from "./NotificationBell";

export function ClientNotificationBell() {
  return (
    <NotificationBell
      getItemUrl={(candidateJobId) => `/client/review/${candidateJobId}`}
    />
  );
}
