"use client";

import React, { useEffect, useMemo, useState } from "react";
import { protectedApiRequest } from "@/lib/api";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import InfoMsg from "@/components/utilities/Info";
import RequireLogin from "@/components/auth/RequireLogin";
import Link from "next/link";

const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
});

type PostImage = { url: string; publicId?: string; width?: number; height?: number };
type PostAuthor =
  | { _id: string; name?: string; username?: string; image?: string }
  | null;
type Post = {
  _id: string;
  content: string;
  images?: PostImage[];
  createdAt?: string;
  userId?: string;
  user?: PostAuthor;
};

type PostsResponse = { success?: boolean; message?: string; data?: Post[] };

const Posts = ({ refreshKey }: { refreshKey?: number }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const username = String(user?.username ?? "").trim();
  const needsUsername = Boolean(user) && !username;

  const previewOptions = useMemo(
    () => ({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeHighlight],
    }),
    [],
  );

  useEffect(() => {
    void (async () => {
      try {
        if (authLoading) return;
        if (!user) return;
        if (needsUsername) return;

        // Fetch friends feed first, then append public posts (de-duplicated).
        const friendsRes = await protectedApiRequest<PostsResponse>({
          url: "/posts/friends",
          method: "GET",
        }).catch(() => null);

        const publicRes = await protectedApiRequest<PostsResponse>({
          url: "/posts",
          method: "GET",
        });

        const friendsPosts = friendsRes?.data ?? [];
        const publicPosts = publicRes?.data ?? [];

        const seen = new Set(friendsPosts.map((p) => p._id));
        const merged = [...friendsPosts, ...publicPosts.filter((p) => !seen.has(p._id))];

        setPosts(merged);
      } catch (e) {
        console.error("Failed to fetch posts:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, needsUsername, refreshKey, user]);

  if (authLoading || loading)
    return <div className="opacity-70 text-sm">Loading posts…</div>;

  if (!user)
    return <RequireLogin title="Feed" message={<span className="text-sm">Log in to see posts.</span>} />;

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

  if (!posts.length) return <div className="opacity-70 text-sm">No posts yet.</div>;

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
                    <span className="opacity-70 block">@{post.user.username}</span>
                  ) : null}
                </div>
              </div>
              {post.createdAt ? (
                <div className="text-xs opacity-60">
                  {post.user?.username ? (
                    <Link
                      className="link link-hover"
                      href={`/d/${encodeURIComponent(post.user.username)}/post/${encodeURIComponent(post._id)}`}
                    >
                      {new Date(post.createdAt).toLocaleString()}
                    </Link>
                  ) : (
                    new Date(post.createdAt).toLocaleString()
                  )}
                </div>
              ) : null}
            </div>
            <div data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}>
              <MarkdownPreview
                source={post.content}
                {...previewOptions}
                components={{
                  a: ({ href, children, ...props }) => {
                    const h = typeof href === "string" ? href : "";
                    if (h.startsWith("/")) {
                      return (
                        <Link href={h} {...props}>
                          {children}
                        </Link>
                      );
                    }
                    return (
                      <a href={h} {...props}>
                        {children}
                      </a>
                    );
                  },
                }}
              />
            </div>
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
          </div>
        </article>
      ))}
    </div>
  );
};

export default Posts;
