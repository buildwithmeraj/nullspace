"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import axios from "axios";

import { protectedApiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import RequireLogin from "@/components/auth/RequireLogin";
import ErrorMsg from "@/components/utilities/Error";
import MarkdownContent from "@/components/markdown/MarkdownContent";
import PostInteractions from "@/components/feed/PostInteractions";
import Loader from "@/components/utilities/Loader";
import PostOwnerActions from "@/components/feed/PostOwnerActions";
import NotFoundState from "@/components/shared/NotFoundState";
import ImageLightbox from "@/components/shared/ImageLightbox";
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
  userId?: string;
  content: string;
  images?: PostImage[];
  createdAt?: string;
  user?: PostAuthor;
};

type PostResponse = { success?: boolean; message?: string; data?: Post };

export default function PostDetail({
  username,
  postId,
}: {
  username: string;
  postId: string;
}) {
  const { user, loading: authLoading } = useAuth();
  const { resolvedTheme } = useTheme();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const colorMode = resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    let cancelled = false;
    setPost(null);
    setError(null);
    setNotFound(false);
    setLoading(true);

    void (async () => {
      if (authLoading) return;
      if (!user) return;

      try {
        const res = await protectedApiRequest<PostResponse>({
          url: `/posts/${encodeURIComponent(postId)}`,
          method: "GET",
        });
        if (!res?.success || !res.data?._id) {
          throw new Error(res?.message ?? "Failed to load post");
        }
        if (cancelled) return;

        // If URL username doesn't match the author username, normalize the URL.
        const authorUsername = String(res.data.user?.username ?? "").trim();
        if (
          authorUsername &&
          authorUsername.toLowerCase() !== username.toLowerCase()
        ) {
          router.replace(
            `/d/${encodeURIComponent(authorUsername)}/post/${encodeURIComponent(res.data._id)}`,
          );
          return;
        }

        setPost(res.data);
      } catch (e) {
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          if (!cancelled) setNotFound(true);
          return;
        }
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load post");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, postId, router, user, username]);

  if (authLoading) return <Loader label="Loading session…" />;
  if (!user)
    return (
      <RequireLogin
        title="Post"
        message={<span className="text-sm">Log in to view this post.</span>}
      />
    );

  if (notFound) {
    return (
      <NotFoundState
        title="Post not found"
        message="This post doesn’t exist (or was deleted)."
        ctaHref="/"
        ctaLabel="Back to feed"
      />
    );
  }

  if (error)
    return <ErrorMsg message={<span className="text-sm">{error}</span>} />;
  if (loading || !post)
    return (
      <div className="mx-auto w-full max-w-3xl px-3 sm:px-4 py-6">
        <PostSkeleton />
      </div>
    );

  const authorUsername = String(post.user?.username ?? "").trim();
  const authorName = String(post.user?.name ?? authorUsername ?? "Unknown");
  const meId = String(user.id ?? user._id ?? "").trim();
  const canManage =
    Boolean(meId) &&
    (String(post.userId ?? "").trim() === meId ||
      String(user.role ?? "") === "admin");

  return (
    <div className="mx-auto w-full max-w-3xl px-3 sm:px-4 py-6 space-y-4">
      <div className="text-sm">
        <Link className="link" href="/">
          ← Back to feed
        </Link>
      </div>

      <article className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="avatar">
                <div className="w-10 rounded-full bg-base-200">
                  {post.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.user.image}
                      alt="Author"
                      className="object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </div>
              </div>

              <div className="text-sm leading-tight">
                {authorUsername ? (
                  <Link
                    className="font-semibold link link-hover block"
                    href={`/d/${encodeURIComponent(authorUsername)}`}
                  >
                    {authorName}
                  </Link>
                ) : (
                  <div className="font-semibold">{authorName}</div>
                )}
                {authorUsername ? (
                  <span className="opacity-70 block">@{authorUsername}</span>
                ) : null}
              </div>
            </div>

            <div className="flex items-start gap-2">
              {post.createdAt ? (
                <div className="text-xs opacity-60">
                  {new Date(post.createdAt).toLocaleString()}
                </div>
              ) : null}
              {canManage ? (
                <PostOwnerActions
                  postId={post._id}
                  content={post.content}
                  onUpdated={({ content }) =>
                    setPost((prev) => (prev ? { ...prev, content } : prev))
                  }
                  onDeleted={() => {
                    router.replace("/");
                  }}
                />
              ) : null}
            </div>
          </div>

          <MarkdownContent source={post.content} colorMode={colorMode} />

          {post.images?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="col-span-full opacity-50">
                <i>Images ({post.images?.length})</i>
              </div>
              {post.images.slice(0, 5).map((img, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${post._id}-${idx}`}
                  src={img.url}
                  alt="Post image"
                  className="rounded-md object-cover w-full h-56 cursor-zoom-in"
                  loading="lazy"
                  decoding="async"
                  onClick={() => setLightboxIndex(idx)}
                />
              ))}
            </div>
          ) : null}

          <PostInteractions postId={post._id} defaultCommentsOpen />
        </div>
      </article>

      <ImageLightbox
        images={(post.images ?? []).map((image, index) => ({
          url: image.url,
          alt: `${authorName} image ${index + 1}`,
        }))}
        index={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />
    </div>
  );
}
