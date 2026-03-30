"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { protectedApiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import InfoMsg from "@/components/utilities/Info";
import RequireLogin from "@/components/auth/RequireLogin";
import Link from "next/link";
import PostInteractions from "@/components/feed/PostInteractions";
import { FaLongArrowAltRight } from "react-icons/fa";

type PostImage = {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
};
type PostAuthor = {
  _id: string;
  name?: string;
  username?: string;
  image?: string;
} | null;
type Post = {
  _id: string;
  content: string;
  images?: PostImage[];
  createdAt?: string;
  userId?: string;
  user?: PostAuthor;
};

type FeedResponse = {
  success?: boolean;
  message?: string;
  data?: { posts?: Post[]; hasMore?: boolean };
};

const PAGE_SIZE = 15;

function toPlainExcerpt(markdown: string, maxChars: number) {
  const input = String(markdown ?? "");

  // Remove fenced code blocks entirely (replace with a small placeholder).
  let text = input
    .replace(/```[\s\S]*?```/g, " [code block] ")
    .replace(/~~~[\s\S]*?~~~/g, " [code block] ");

  // Images: keep alt text if present.
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");

  // Links: keep the label only.
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Inline code: drop backticks, keep content.
  text = text.replace(/`([^`]+)`/g, "$1");

  // Strip common markdown prefixes.
  text = text
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
    .replace(/^\s{0,3}>\s?/gm, "") // blockquotes
    .replace(/^\s{0,3}([-*+])\s+/gm, "") // unordered lists
    .replace(/^\s{0,3}\d+\.\s+/gm, ""); // ordered lists

  // Remove remaining markdown emphasis markers.
  text = text.replace(/[*_~]/g, "");

  // Collapse whitespace/newlines for a compact feed preview.
  text = text.replace(/\s+/g, " ").trim();

  if (!text) return "";
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

const Posts = ({ refreshKey }: { refreshKey?: number }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  // "loading" is only for the initial page load. If the user is logged out we
  // should render the login placeholder instead of being stuck in a loading UI.
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const username = String(user?.username ?? "").trim();
  const needsUsername = Boolean(user) && !username;
  const fetchedIdsRef = useRef<Set<string>>(new Set());
  const initKeyRef = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const EXCERPT_CHARS = 420;

  const loadMore = useCallback(
    async (reset = false) => {
      if (authLoading) return;
      if (!user) return;
      if (needsUsername) return;
      if (!hasMore && !reset) return;
      if (loadingMore) return;

      if (reset) setLoading(true);
      setLoadingMore(true);
      try {
        if (reset) {
          fetchedIdsRef.current = new Set();
          setPosts([]);
          setHasMore(true);
        }

        const excludeIds = Array.from(fetchedIdsRef.current);
        const res = await protectedApiRequest<FeedResponse>({
          url: "/posts/feed",
          method: "POST",
          data: { limit: PAGE_SIZE, excludeIds },
        });

        const nextPosts = res?.data?.posts ?? [];
        const nextHasMore = Boolean(res?.data?.hasMore);

        const unique = nextPosts.filter(
          (p) => !fetchedIdsRef.current.has(p._id),
        );
        unique.forEach((p) => fetchedIdsRef.current.add(p._id));

        setPosts((prev) => (reset ? unique : [...prev, ...unique]));
        setHasMore(nextHasMore);
      } catch (e) {
        console.error("Failed to fetch feed:", e);
        setHasMore(false);
      } finally {
        if (reset) setLoading(false);
        setLoadingMore(false);
      }
    },
    [authLoading, hasMore, loadingMore, needsUsername, user],
  );

  useEffect(() => {
    // Initial load should wait for auth to resolve; otherwise we may skip the
    // request and never re-run if we only depend on `refreshKey`.
    if (authLoading) return;
    if (!user) return;
    if (needsUsername) return;

    const uid = String(user.id ?? user._id ?? "");
    const key = `${uid}:${String(refreshKey ?? 0)}`;
    if (initKeyRef.current === key) return;
    initKeyRef.current = key;

    void loadMore(true);
  }, [authLoading, loadMore, needsUsername, refreshKey, user]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (authLoading || !user || needsUsername) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) void loadMore(false);
      },
      { root: null, rootMargin: "200px", threshold: 0 },
    );

    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, needsUsername, user, hasMore]);

  if (authLoading || loading)
    return <div className="opacity-70 text-sm">Loading posts…</div>;

  if (!user)
    return (
      <RequireLogin
        title="Feed"
        message={<span className="text-sm">Log in to see posts.</span>}
      />
    );

  if (needsUsername)
    return (
      <InfoMsg
        message={
          <span className="text-sm">
            You must complete your profile (set a{" "}
            <Link className="link" href="/profile/edit">
              username
            </Link>
            ) to continue.
          </span>
        }
      />
    );

  if (!posts.length)
    return <div className="opacity-70 text-sm">No posts yet.</div>;

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <article key={post._id} className="card bg-base-100 shadow">
          <div className="card-body space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="avatar">
                  <div className="w-10 rounded-full bg-base-200">
                    {post.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={String(post.user.image ?? "")}
                        alt="Author"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                </div>

                <div className="text-sm leading-tight">
                  {post.user?.username ? (
                    <Link
                      className="font-semibold link link-hover block"
                      href={`/d/${encodeURIComponent(post.user.username)}`}
                    >
                      {String(post.user.name ?? post.user.username)}
                    </Link>
                  ) : (
                    <span className="font-semibold block">
                      {String(post.user?.name ?? "Unknown")}
                    </span>
                  )}
                  {post.user?.username ? (
                    <span className="opacity-70 block">
                      @{post.user.username}
                    </span>
                  ) : null}
                </div>
              </div>
              {post.createdAt ? (
                <div className="text-xs opacity-60">
                  {new Date(post.createdAt).toLocaleString()}
                </div>
              ) : null}
            </div>
            {(() => {
              const full = String(post.content ?? "");
              const trimmed = full.trim();
              const isLong = trimmed.length > EXCERPT_CHARS;
              const preview = toPlainExcerpt(full, EXCERPT_CHARS);
              const u = post.user?.username ? String(post.user.username) : "";
              const href = u
                ? `/d/${encodeURIComponent(u)}/post/${encodeURIComponent(post._id)}`
                : `/d/unknown/post/${encodeURIComponent(post._id)}`;
              return (
                <div className="space-y-2">
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {preview}
                  </p>
                  <div className="flex items-center justify-center">
                    <Link
                      className="flex items-center gap-2 justify-center cursor-pointer opacity-50 hover:opacity-95 mt-3"
                      href={href}
                    >
                      View full post <FaLongArrowAltRight />
                    </Link>
                    {isLong ? (
                      <span className="text-xs opacity-60">(trimmed)</span>
                    ) : null}
                  </div>
                </div>
              );
            })()}
            {post.images?.length ? (
              <div className="grid grid-cols-2 gap-2">
                {post.images.slice(0, 5).map((img, idx) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${post._id}-${idx}`}
                    src={img.url}
                    alt="Post image"
                    className="rounded-md object-cover w-full h-40"
                  />
                ))}
              </div>
            ) : null}

            <PostInteractions postId={post._id} />
          </div>
        </article>
      ))}

      <div ref={sentinelRef} />
      {loadingMore ? (
        <div className="opacity-70 text-sm">Loading more…</div>
      ) : !hasMore ? (
        <div className="opacity-70 text-sm">No more posts.</div>
      ) : null}
    </div>
  );
};

export default Posts;
