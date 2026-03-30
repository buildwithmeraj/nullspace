"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

import { protectedApiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import MarkdownContent from "@/components/markdown/MarkdownContent";

type ReactionSummary = {
  reactionId: string | null;
  postId: string;
  count: number;
  lovedByMe: boolean;
};
type ReactionSummaryResponse = { success?: boolean; message?: string; data?: ReactionSummary };

type ReactionDoc = { _id?: string; userIds?: unknown[]; postId?: string };
type ReactionDocResponse = { success?: boolean; message?: string; data?: ReactionDoc };

type CommentAuthor = { _id: string; name?: string; username?: string; image?: string } | null;
type Comment = {
  _id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt?: string;
  user?: CommentAuthor;
};

type CommentsResponse = { success?: boolean; message?: string; data?: Comment[] };
type CommentCreateResponse = { success?: boolean; message?: string; data?: Comment };

function countUserIds(userIds: unknown) {
  return Array.isArray(userIds) ? userIds.length : 0;
}

export default function PostInteractions({ postId }: { postId: string }) {
  const { user, loading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const colorMode: "dark" | "light" =
    resolvedTheme === "dark" ? "dark" : "light";

  const [reaction, setReaction] = useState<ReactionSummary>({
    reactionId: null,
    postId,
    count: 0,
    lovedByMe: false,
  });
  const [reactionLoading, setReactionLoading] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const commentsCount = useMemo(() => comments.length, [comments.length]);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) return;

    void (async () => {
      setReactionLoading(true);
      try {
        const res = await protectedApiRequest<ReactionSummaryResponse>({
          url: `/reactions/summary/${encodeURIComponent(postId)}`,
          method: "GET",
        });
        if (!cancelled && res?.data) setReaction(res.data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setReactionLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, postId, user]);

  const toggleLove = async () => {
    if (authLoading || !user) return;
    if (reactionLoading) return;

    setReactionLoading(true);
    try {
      if (!reaction.lovedByMe) {
        const res = await protectedApiRequest<ReactionDocResponse>({
          url: "/reactions",
          method: "POST",
          data: { postId },
        });
        const id = res?.data?._id ? String(res.data._id) : reaction.reactionId;
        const count = countUserIds(res?.data?.userIds);
        setReaction({ reactionId: id ?? null, postId, count, lovedByMe: true });
      } else if (reaction.reactionId) {
        const res = await protectedApiRequest<ReactionDocResponse>({
          url: `/reactions/${encodeURIComponent(reaction.reactionId)}`,
          method: "PATCH",
          data: { action: "unlove" },
        });

        // When the last love is removed, backend may delete the doc and not return `data`.
        const nextId = res?.data?._id ? String(res.data._id) : null;
        const nextCount = countUserIds(res?.data?.userIds);
        setReaction({
          reactionId: nextId,
          postId,
          count: nextCount,
          lovedByMe: false,
        });
      } else {
        // Missing reactionId; refetch summary then retry.
        const summary = await protectedApiRequest<ReactionSummaryResponse>({
          url: `/reactions/summary/${encodeURIComponent(postId)}`,
          method: "GET",
        });
        if (summary?.data) setReaction(summary.data);
      }
    } catch {
      // ignore
    } finally {
      setReactionLoading(false);
    }
  };

  const openComments = async () => {
    if (commentsOpen) {
      setCommentsOpen(false);
      return;
    }
    setCommentsOpen(true);
    if (comments.length) return;

    if (authLoading || !user) return;
    setCommentsLoading(true);
    try {
      const res = await protectedApiRequest<CommentsResponse>({
        url: `/comments?postId=${encodeURIComponent(postId)}`,
        method: "GET",
      });
      setComments(res?.data ?? []);
    } catch {
      // ignore
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    const content = commentText.trim();
    if (!content) return;
    if (commentSubmitting) return;
    if (authLoading || !user) return;

    setCommentSubmitting(true);
    try {
      const res = await protectedApiRequest<CommentCreateResponse>({
        url: "/comments",
        method: "POST",
        data: { postId, content },
      });
      if (res?.data?._id) {
        setComments((prev) => [res.data as Comment, ...prev]);
        setCommentText("");
      }
    } catch {
      // ignore
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <div className="pt-2 space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`btn btn-sm ${reaction.lovedByMe ? "btn-error" : "btn-ghost"}`}
          onClick={() => void toggleLove()}
          disabled={reactionLoading || authLoading || !user}
        >
          {reactionLoading ? "…" : reaction.lovedByMe ? "Loved" : "Love"}{" "}
          <span className="opacity-70">({reaction.count})</span>
        </button>
        <button
          type="button"
          className="btn btn-sm btn-ghost"
          onClick={() => void openComments()}
          disabled={authLoading || !user}
        >
          Comment <span className="opacity-70">({commentsCount})</span>
        </button>
      </div>

      {commentsOpen ? (
        <div className="rounded-md border border-base-300 bg-base-100 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Comments</div>
            <button type="button" className="btn btn-xs btn-ghost" onClick={() => setCommentsOpen(false)}>
              Close
            </button>
          </div>

          <div className="flex gap-2">
            <textarea
              className="textarea textarea-bordered w-full"
              rows={2}
              placeholder="Write a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={commentSubmitting}
            />
            <button
              type="button"
              className="btn btn-neutral"
              onClick={() => void submitComment()}
              disabled={commentSubmitting || !commentText.trim()}
            >
              {commentSubmitting ? "…" : "Post"}
            </button>
          </div>

          {commentsLoading ? (
            <div className="opacity-70 text-sm">Loading comments…</div>
          ) : comments.length ? (
            <div className="space-y-3">
              {comments.map((c) => {
                const u = c.user;
                const uname = String(u?.username ?? "").trim();
                return (
                  <div key={c._id} className="flex gap-3">
                    <div className="avatar">
                      <div className="w-8 rounded-full bg-base-200">
                        {u?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.image} alt="Author" />
                        ) : null}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm">
                        {uname ? (
                          <Link className="font-semibold link link-hover" href={`/d/${encodeURIComponent(uname)}`}>
                            {String(u?.name ?? uname)}
                          </Link>
                        ) : (
                          <span className="font-semibold">{String(u?.name ?? "User")}</span>
                        )}
                        {uname ? <span className="opacity-70"> @{uname}</span> : null}
                      </div>
                      <div className="text-sm">
                        <MarkdownContent source={c.content} colorMode={colorMode} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="opacity-70 text-sm">No comments yet.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
