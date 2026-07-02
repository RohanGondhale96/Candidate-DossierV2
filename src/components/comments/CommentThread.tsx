"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

interface CommentItem {
  id: string;
  content: string;
  authorName: string;
  authorRole: "VENDOR" | "CLIENT";
  isMine: boolean;
  createdAt: string;
}

function initials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

export function CommentThread({
  candidateJobId,
  className,
  hideHeader = false,
  onCountChange,
}: {
  candidateJobId: string;
  className?: string;
  hideHeader?: boolean;
  onCountChange?: (count: number) => void;
}) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?candidateJobId=${candidateJobId}`);
      if (res.ok) setComments((await res.json()).comments ?? []);
    } finally {
      setLoading(false);
    }
  }, [candidateJobId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  useEffect(() => { onCountChange?.(comments.length); }, [comments.length, onCountChange]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  async function post() {
    const content = text.trim();
    if (!content || posting) return;
    setPosting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateJobId, content }),
      });
      if (!res.ok) throw new Error("Could not post comment");
      const { comment } = await res.json();
      setComments((c) => [...c, comment]);
      setText("");
      textareaRef.current?.focus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post comment");
    } finally {
      setPosting(false);
    }
  }

  // Group messages by day for date separators
  const grouped: { day: string; items: CommentItem[] }[] = [];
  for (const c of comments) {
    const day = dayLabel(c.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.day === day) {
      last.items.push(c);
    } else {
      grouped.push({ day, items: [c] });
    }
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {!hideHeader && (
        <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <MessageSquare className="h-4 w-4" />
          Comments
          {comments.length > 0 && (
            <span className="text-xs font-normal text-gray-400">({comments.length})</span>
          )}
        </div>
      )}

      {/* Message list */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {loading ? (
          <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
          </div>
        ) : comments.length === 0 ? (
          <p className="py-2 text-xs text-gray-400">No comments yet. Start the conversation below.</p>
        ) : (
          grouped.map(({ day, items }) => (
            <div key={day} className="flex flex-col gap-3">
              {/* Day separator */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[10px] text-gray-400">{day}</span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              {items.map((c) => (
                <div
                  key={c.id}
                  className={cn("flex gap-2", c.isMine ? "flex-row-reverse" : "flex-row")}
                >
                  {/* Avatar — only for others */}
                  {!c.isMine && (
                    <div
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                        c.authorRole === "CLIENT"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-[#6B4FBB]"
                      )}
                    >
                      {initials(c.authorName)}
                    </div>
                  )}

                  {/* Bubble + meta */}
                  <div className={cn("flex max-w-[78%] flex-col gap-0.5", c.isMine ? "items-end" : "items-start")}>
                    {/* Sender name + role (others only) */}
                    {!c.isMine && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-gray-600">{c.authorName}</span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide",
                            c.authorRole === "CLIENT"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-[#6B4FBB]"
                          )}
                        >
                          {c.authorRole === "CLIENT" ? "Client" : "Vendor"}
                        </span>
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                        c.isMine
                          ? "rounded-br-sm bg-[#6B4FBB] text-white"
                          : "rounded-bl-sm bg-gray-100 text-gray-800"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{c.content}</p>
                    </div>

                    {/* Timestamp */}
                    <span className="text-[10px] text-gray-400">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="mt-3 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
          placeholder="Write a message…"
          rows={1}
          className="flex-1 resize-none overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-[#6B4FBB] focus:bg-white focus:ring-0"
          style={{ minHeight: "38px" }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              post();
            }
          }}
        />
        <button
          onClick={post}
          disabled={posting || !text.trim()}
          aria-label="Send message"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#6B4FBB] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {posting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <p className="mt-1.5 text-center text-[10px] text-gray-400">⌘/Ctrl + Enter to send</p>
    </div>
  );
}
