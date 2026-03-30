"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import InfoMsg from "@/components/utilities/Info";
import RequireLogin from "@/components/auth/RequireLogin";
import Link from "next/link";
import LoaderBlock from "@/components/utilities/LoaderBlock";
import { protectedApiRequest } from "@/lib/api";
import { FaLongArrowAltRight } from "react-icons/fa";
import PostOwnerActions from "@/components/feed/PostOwnerActions";

type PostImage = {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
};
type Post = {
  _id: string;
  userId?: string;
  content: string;
  images?: PostImage[];
  createdAt?: string;
};
type PostsResponse = { success?: boolean; message?: string; data?: Post[] };

function toPlainExcerpt(markdown: string, maxChars: number) {
  const input = String(markdown ?? "");
  let text = input
    .replace(/```[\s\S]*?```/g, " [code block] ")
    .replace(/~~~[\s\S]*?~~~/g, " [code block] ");
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}([-*+])\s+/gm, "")
    .replace(/^\s{0,3}\d+\.\s+/gm, "");
  text = text.replace(/[*_~]/g, "");
  text = text.replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

const Profile = () => {
  const { user, loading, logout } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (loading || !user) return;
    setPosts([]);
    setPostsLoading(true);

    void (async () => {
      try {
        const res = await protectedApiRequest<PostsResponse>({
          url: "/posts",
          method: "GET",
        });
        if (!cancelled) setPosts(res?.data ?? []);
      } finally {
        if (!cancelled) setPostsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  if (loading) return <LoaderBlock />;
  if (!user)
    return (
      <RequireLogin
        title="Profile"
        message={<span className="text-sm">Log in to view your profile.</span>}
      />
    );

  const username = String(user.username ?? "").trim();
  const meId = String(user.id ?? user._id ?? "").trim();
  const name = String(user.name ?? "").trim();
  const email = String(user.email ?? "").trim();
  const createdAt = String(user.createdAt ?? "").trim();
  const image = String(user.image ?? "").trim();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <section className="max-w-xl mx-auto overflow-hidden">
        <div className="h-20" />
        <div className="card-body pt-0 -mt-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="avatar">
                <div className="w-20 rounded-full ring ring-base-100 ring-offset-2 ring-offset-base-100 bg-base-200">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="Profile" className="object-cover" />
                  ) : null}
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold truncate">
                  {name || username || "Your profile"}
                </h1>
                {username ? (
                  <div className="text-sm opacity-70 truncate">
                    @{username}{" "}
                    <span className="opacity-60">
                      ({postsLoading ? "…" : posts.length} Posts)
                    </span>
                  </div>
                ) : (
                  <div className="text-sm opacity-70 truncate">{email}</div>
                )}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  {createdAt ? (
                    <span className="badge badge-ghost">
                      Member since {new Date(createdAt).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link className="btn btn-sm btn-outline" href="/profile/edit">
                Edit profile
              </Link>
              <button
                className="btn btn-sm btn-error"
                onClick={() => void logout()}
              >
                Logout
              </button>
            </div>
          </div>

          {!String(user.username ?? "").trim() ? (
            <InfoMsg
              message={
                <span className="text-sm">
                  You must complete your profile (set a username) to continue.{" "}
                  <Link className="link" href="/profile/edit">
                    Update now
                  </Link>
                  .
                </span>
              }
            />
          ) : null}
        </div>
      </section>

      <section className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="card-title text-base">Your posts</h2>
            <div className="text-xs opacity-60">
              {posts.length ? `${posts.length} total` : null}
            </div>
          </div>

          {!username ? (
            <InfoMsg
              message={
                <span className="text-sm">
                  Set a username to view your posts in a dedicated page.
                </span>
              }
            />
          ) : null}

          {postsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-md border border-base-200 p-3"
                >
                  <div className="space-y-2">
                    <div className="skeleton h-3 w-full" />
                    <div className="skeleton h-3 w-5/6" />
                    <div className="skeleton h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length ? (
            <div className="space-y-3">
              {posts.slice(0, 10).map((p) => {
                const href = username
                  ? `/d/${encodeURIComponent(username)}/post/${encodeURIComponent(p._id)}`
                  : `/d/unknown/post/${encodeURIComponent(p._id)}`;
                return (
                  <div
                    key={p._id}
                    className="rounded-md border border-base-200 p-3 hover:bg-base-200/40 transition-colors"
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {toPlainExcerpt(p.content, 420)}
                    </p>
                    <div className="pt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link className="btn btn-xs btn-ghost gap-2" href={href}>
                          View full post <FaLongArrowAltRight />
                        </Link>
                        {meId && String(p.userId ?? "") === meId ? (
                          <PostOwnerActions
                            postId={p._id}
                            content={p.content}
                            onUpdated={({ content }) =>
                              setPosts((prev) =>
                                prev.map((x) => (x._id === p._id ? { ...x, content } : x)),
                              )
                            }
                            onDeleted={() =>
                              setPosts((prev) => prev.filter((x) => x._id !== p._id))
                            }
                          />
                        ) : null}
                      </div>
                      {p.createdAt ? (
                        <span className="text-xs opacity-60">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm opacity-70">No posts yet.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Profile;
