"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentItem {
  id: string;
  content: string;
  authorName: string;
  authorRole: "VENDOR" | "CLIENT";
  isMine: boolean;
  createdAt: string;
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

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?candidateJobId=${candidateJobId}`);
      if (res.ok) setComments((await res.json()).comments ?? []);
    } finally {
      setLoading(false);
    }
  }, [candidateJobId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    onCountChange?.(comments.length);
  }, [comments.length, onCountChange]);

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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post comment");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {!hideHeader && (
        <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
          <MessageSquare className="h-4 w-4" />
          Comments
          {comments.length > 0 && (
            <span className="text-xs font-normal text-gray-400">
              ({comments.length})
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading…
        </div>
      ) : comments.length === 0 ? (
        <p className="py-2 text-xs text-gray-400">
          No comments yet. Start the conversation below.
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className={cn(
                "rounded-lg px-3 py-2",
                c.isMine ? "bg-primary/10" : "bg-muted"
              )}
            >
              <div className="mb-0.5 flex items-center gap-2">
                <span className="text-xs font-medium text-gray-800">
                  {c.authorName}
                </span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-medium",
                    c.authorRole === "CLIENT"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  )}
                >
                  {c.authorRole === "CLIENT" ? "Client" : "Vendor"}
                </span>
                <span className="text-[10px] text-gray-400">
                  {formatDistanceToNow(new Date(c.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…"
          rows={2}
          className="resize-none text-sm"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              post();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400">⌘/Ctrl + Enter to send</span>
          <Button
            size="sm"
            onClick={post}
            disabled={posting || !text.trim()}
            className="gap-1.5"
          >
            {posting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
