"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

import { protectedApiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import RequireLogin from "@/components/auth/RequireLogin";
import ErrorMsg from "@/components/utilities/Error";
import MarkdownContent from "@/components/markdown/MarkdownContent";
import PostInteractions from "@/components/feed/PostInteractions";

type PostImage = { url: string; publicId?: string; width?: number; height?: number };
type PostAuthor = { _id: string; name?: string; username?: string; image?: string } | null;
type Post = {
  _id: string;
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
  const [loading, setLoading] = useState(true);
  const colorMode = resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    let cancelled = false;
    setPost(null);
    setError(null);
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
        if (authorUsername && authorUsername.toLowerCase() !== username.toLowerCase()) {
          router.replace(`/d/${encodeURIComponent(authorUsername)}/post/${encodeURIComponent(res.data._id)}`);
          return;
        }

        setPost(res.data);
      } catch (e) {
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

  if (authLoading) return <div className="opacity-70 text-sm">Loading…</div>;
  if (!user) return <RequireLogin title="Post" message={<span className="text-sm">Log in to view this post.</span>} />;

  if (error) return <ErrorMsg message={<span className="text-sm">{error}</span>} />;
  if (loading || !post) return <div className="opacity-70 text-sm">Loading post…</div>;

  const authorUsername = String(post.user?.username ?? "").trim();
  const authorName = String(post.user?.name ?? authorUsername ?? "Unknown");

  return (
    <div className="mx-auto w-full max-w-3xl px-3 sm:px-4 py-6 space-y-4">
      <div className="text-sm">
        <Link className="link" href="/">
          ← Back to feed
        </Link>
      </div>

      <article className="card bg-base-100 shadow">
        <div className="card-body space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="avatar">
                <div className="w-10 rounded-full bg-base-200">
                  {post.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.user.image} alt="Author" className="object-cover" />
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

            {post.createdAt ? (
              <div className="text-xs opacity-60">
                {new Date(post.createdAt).toLocaleString()}
              </div>
            ) : null}
          </div>

          <MarkdownContent source={post.content} colorMode={colorMode} />

          {post.images?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {post.images.slice(0, 5).map((img, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${post._id}-${idx}`}
                  src={img.url}
                  alt="Post image"
                  className="rounded-md object-cover w-full h-56"
                />
              ))}
            </div>
          ) : null}

          <PostInteractions postId={post._id} />
        </div>
      </article>
    </div>
  );
}
