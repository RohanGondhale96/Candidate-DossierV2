"use client";

import { NotificationBell } from "./NotificationBell";

export function VendorNotificationBell() {
  return (
    <NotificationBell
      getItemUrl={(candidateJobId) =>
        `/vendor/candidates?openCard=${candidateJobId}`
      }
    />
  );
}
