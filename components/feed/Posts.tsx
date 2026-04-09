"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { protectedApiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import InfoMsg from "@/components/utilities/Info";
import Link from "next/link";
import PostInteractions from "@/components/feed/PostInteractions";
import { FaLongArrowAltRight } from "react-icons/fa";
import Loader from "../utilities/Loader";
import PostOwnerActions from "@/components/feed/PostOwnerActions";
import PostSkeleton from "@/components/feed/PostSkeleton";

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

type PostsResponse = { success?: boolean; message?: string; data?: Post[] };

const PAGE_SIZE = 15;

function FeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, idx) => (
        <PostSkeleton key={idx} />
      ))}
    </div>
  );
}

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

const Posts = ({
  refreshKey,
  variant = "feed",
  userId,
}: {
  refreshKey?: number;
  variant?: "feed" | "profile" | "user";
  userId?: string;
}) => {
  const [posts, setPosts] = useState<Post[]>([]);
  // "loading" is only for the initial page load. If the user is logged out we
  // should render the login placeholder instead of being stuck in a loading UI.
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const meId = String(user?.id ?? user?._id ?? "").trim();
  const username = String(user?.username ?? "").trim();
  const needsUsername = Boolean(user) && !username;
  const fetchedIdsRef = useRef<Set<string>>(new Set());
  const initKeyRef = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const EXCERPT_CHARS = 420;
  const isProfile = variant === "profile";
  const isUserList = variant === "user";
  const isFiniteList = isProfile || isUserList;

  const loadMore = useCallback(
    async (reset = false) => {
      if (authLoading) return;
      if (!user) return;
      if (needsUsername) return;
      if (isUserList && !String(userId ?? "").trim()) return;
      if (!isFiniteList && !hasMore && !reset) return;
      if (loadingMore) return;

      if (reset) setLoading(true);
      setLoadingMore(true);
      try {
        if (reset) {
          fetchedIdsRef.current = new Set();
          setPosts([]);
          setHasMore(true);
        }

        let nextPosts: Post[] = [];
        let nextHasMore = false;

        if (isProfile) {
          const res = await protectedApiRequest<PostsResponse>({
            url: "/posts",
            method: "GET",
          });
          nextPosts = res?.data ?? [];
        } else if (isUserList) {
          const res = await protectedApiRequest<PostsResponse>({
            url: `/posts/user/${encodeURIComponent(String(userId ?? "").trim())}`,
            method: "GET",
          });
          nextPosts = res?.data ?? [];
        } else {
          const res = await protectedApiRequest<FeedResponse>({
            url: "/posts/feed",
            method: "POST",
            data: {
              limit: PAGE_SIZE,
              excludeIds: Array.from(fetchedIdsRef.current),
            },
          });
          nextPosts = res?.data?.posts ?? [];
          nextHasMore = Boolean(res?.data?.hasMore);
        }

        const unique = nextPosts.filter(
          (p) => !fetchedIdsRef.current.has(p._id),
        );
        unique.forEach((p) => fetchedIdsRef.current.add(p._id));

        setPosts((prev) => (reset ? unique : [...prev, ...unique]));
        setHasMore(isFiniteList ? false : nextHasMore);
      } catch (e) {
        console.error("Failed to fetch feed:", e);
        setHasMore(false);
      } finally {
        if (reset) setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      authLoading,
      hasMore,
      isFiniteList,
      isProfile,
      isUserList,
      loadingMore,
      needsUsername,
      user,
      userId,
    ],
  );

  useEffect(() => {
    // Initial load should wait for auth to resolve; otherwise we may skip the
    // request and never re-run if we only depend on `refreshKey`.
    if (authLoading) return;
    if (!user) return;
    if (needsUsername) return;

    const uid = String(user.id ?? user._id ?? "");
    const key = `${uid}:${String(refreshKey ?? 0)}:${variant}:${String(userId ?? "")}`;
    if (initKeyRef.current === key) return;
    initKeyRef.current = key;

    void loadMore(true);
  }, [authLoading, loadMore, needsUsername, refreshKey, user, userId, variant]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (isFiniteList) return;
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
  }, [authLoading, hasMore, isFiniteList, needsUsername, user]);

  if (authLoading) return <Loader label="Loading session…" />;
  if (loading) return <FeedSkeleton />;

  if (!user)
    return (
      <div className="p-6">
        <h2 className="font-bold text-2xl text-center my-3">
          Welcome to NullSpace
        </h2>
        <p className="opacity-60">
          The place for developers to connect, share, and grow. NullSpace is a
          community for developers to collaborate and learn from each other.
          NullSpace supports markdown and code snippets. To get started, please
          <Link className="text-secondary font-bold" href="/login">
            {" "}
            login
          </Link>{" "}
          or{" "}
          <Link className="text-secondary font-bold" href="/register">
            {" "}
            register
          </Link>{" "}
          .
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://res.cloudinary.com/dwicoeqnl/image/upload/v1774867206/uploads/ovazn7napy2zx1viodza.png"
          alt="Notice"
          className="w-full h-auto"
        />
      </div>
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
    return (
      <div className="opacity-70 text-sm">
        {isProfile
          ? "You haven't posted yet."
          : isUserList
            ? "No posts from this developer yet."
            : "No posts yet."}
      </div>
    );

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <article
          key={post._id}
          className="card bg-base-100 border border-base-200 shadow-sm transition-shadow hover:shadow-md"
        >
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
                        loading="lazy"
                        decoding="async"
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
              <div className="flex items-start gap-2">
                {post.createdAt ? (
                  <div className="text-xs opacity-60">
                    {new Date(post.createdAt).toLocaleString()}
                  </div>
                ) : null}
                {meId && String(post.userId ?? "") === meId ? (
                  <PostOwnerActions
                    postId={post._id}
                    content={post.content}
                    onUpdated={({ content }) =>
                      setPosts((prev) =>
                        prev.map((p) =>
                          p._id === post._id ? { ...p, content } : p,
                        ),
                      )
                    }
                    onDeleted={() =>
                      setPosts((prev) => prev.filter((p) => p._id !== post._id))
                    }
                  />
                ) : null}
              </div>
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
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <Link className="btn btn-sm btn-ghost gap-2" href={href}>
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
                    loading="lazy"
                    decoding="async"
                  />
                ))}
              </div>
            ) : null}
            <div className="divider -my-4"></div>
            <PostInteractions postId={post._id} />
          </div>
        </article>
      ))}

      {!isFiniteList ? <div ref={sentinelRef} /> : null}
      {!isFiniteList ? (
        loadingMore ? (
          <Loader label="Loading more…" />
        ) : !hasMore ? (
          <div className="opacity-50 text-sm divider py-6">
            <i>No more posts to show</i>
          </div>
        ) : null
      ) : null}
    </div>
  );
};

export default Posts;
