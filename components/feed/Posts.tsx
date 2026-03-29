"use client";

import React, { useEffect, useMemo, useState } from "react";
import { protectedApiRequest } from "@/lib/api";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import InfoMsg from "@/components/utilities/Info";

const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
});

type PostImage = { url: string; publicId?: string; width?: number; height?: number };
type Post = {
  _id: string;
  content: string;
  images?: PostImage[];
  createdAt?: string;
  userId?: string;
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
    return (
      <div className="opacity-70 text-sm">
        You need to <Link className="link" href="/login">log in</Link> to see posts.
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

  if (!posts.length) return <div className="opacity-70 text-sm">No posts yet.</div>;

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <article key={post._id} className="card bg-base-100 shadow">
          <div className="card-body space-y-3">
            <div data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}>
              <MarkdownPreview source={post.content} {...previewOptions} />
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
