"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { cn } from "@/lib/utils";

interface NotificationItem {
  candidateJobId: string;
  candidateName: string;
  jobTitle: string;
  unreadCount: number;
  lastCommentPreview: string;
  lastCommentAt: string;
}

export function VendorNotificationBell() {
  const router = useRouter();
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setTotal(data.total ?? 0);
      setItems(data.items ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function handleItemClick(candidateJobId: string) {
    setOpen(false);
    router.push(`/vendor/candidates?openCard=${candidateJobId}`);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        className={cn(
          "relative flex h-8 w-8 items-center justify-center rounded-md transition-colors",
          open
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-lg border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <p className="text-[13px] font-semibold">Notifications</p>
            {total > 0 && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                {total} unread
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Bell className="h-7 w-7 text-muted-foreground/30" />
              <p className="text-[13px] text-muted-foreground">No new comments</p>
            </div>
          ) : (
            <div className="max-h-[360px] divide-y overflow-y-auto">
              {items.map((item) => (
                <button
                  key={item.candidateJobId}
                  onClick={() => handleItemClick(item.candidateJobId)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <span className="text-[11px] font-bold">{item.unreadCount}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[13px] font-semibold text-foreground">
                        {item.candidateName}
                      </p>
                      {item.lastCommentAt && (
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(item.lastCommentAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {item.jobTitle}
                    </p>
                    {item.lastCommentPreview && (
                      <p className="mt-1 line-clamp-2 text-[12px] text-foreground/70">
                        &ldquo;{item.lastCommentPreview}&rdquo;
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
