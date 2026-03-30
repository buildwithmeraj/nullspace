"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { protectedApiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import ErrorMsg from "@/components/utilities/Error";
import SuccessMsg from "@/components/utilities/Success";
import RequireLogin from "@/components/auth/RequireLogin";
import Loader from "@/components/utilities/Loader";
import LoaderBlock from "@/components/utilities/LoaderBlock";
import { FaLongArrowAltRight } from "react-icons/fa";
import PostOwnerActions from "@/components/feed/PostOwnerActions";
import NotFoundState from "@/components/shared/NotFoundState";

type PublicUser = {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  image?: string;
  bio?: string;
  createdAt?: string;
};

type FriendStatus = "pending" | "accepted";
type Friend = {
  _id: string;
  requesterId: string;
  recipientId: string;
  status: FriendStatus;
};

type ApiResponse<T> = { success?: boolean; message?: string; data?: T };

type PostImage = {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
};
type Post = {
  _id: string;
  content: string;
  images?: PostImage[];
  createdAt?: string;
  userId?: string;
  user?: PublicUser | null;
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

export default function DeveloperProfile({ username }: { username: string }) {
  const { user, loading } = useAuth();
  const [dev, setDev] = useState<PublicUser | null>(null);
  const [relationship, setRelationship] = useState<Friend | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);

  const meId = useMemo(() => {
    if (!user) return null;
    return String(user.id ?? user._id ?? "");
  }, [user]);

  const load = async (normalizedUsername: string, uid: string) => {
    const u = await protectedApiRequest<ApiResponse<PublicUser>>({
      url: `/users/username/${encodeURIComponent(normalizedUsername)}`,
      method: "GET",
    });
    if (!u?.success || !u.data?._id) {
      throw new Error(u?.message ?? "Failed to load profile");
    }

    const friends = await protectedApiRequest<ApiResponse<Friend[]>>({
      url: "/friends",
      method: "GET",
    });
    const list = friends?.data ?? [];
    const rel = list.find((f) => {
      const a = String(f.requesterId);
      const b = String(f.recipientId);
      return (
        (a === String(uid) && b === String(u.data!._id)) ||
        (a === String(u.data!._id) && b === String(uid))
      );
    });

    return { dev: u.data, relationship: rel ?? null };
  };

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setInfo(null);
    setDev(null);
    setRelationship(null);
    setNotFound(false);
    setPosts([]);

    (async () => {
      if (loading) return;
      if (!user) return;

      try {
        const normalized = username.replace(/^@/, "");
        if (cancelled) return;
        const uid = String(meId ?? "");
        if (!uid) throw new Error("Unauthorized");
        let nextDev: PublicUser;
        let nextRel: Friend | null;
        try {
          const loaded = await load(normalized, uid);
          nextDev = loaded.dev;
          nextRel = loaded.relationship;
        } catch (e) {
          if (axios.isAxiosError(e) && e.response?.status === 404) {
            if (!cancelled) setNotFound(true);
            return;
          }
          throw e;
        }
        if (cancelled) return;
        setDev(nextDev);
        setRelationship(nextRel);

        // Load the developer's posts (public in-app, but still auth-protected).
        setPostsLoading(true);
        const postsRes = await protectedApiRequest<PostsResponse>({
          url: `/posts/user/${encodeURIComponent(String(nextDev._id))}`,
          method: "GET",
        }).catch(() => null);
        if (!cancelled) setPosts(postsRes?.data ?? []);
        if (!cancelled) setPostsLoading(false);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load profile");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, meId, user, username]);

  const sendRequest = async () => {
    if (!dev?._id) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await protectedApiRequest<ApiResponse<Friend>>({
        url: "/friends",
        method: "POST",
        data: { recipientId: dev._id },
      });
      if (!res?.success || !res.data?._id) {
        throw new Error(res?.message ?? "Failed to send request");
      }
      setRelationship(res.data);
      setInfo("Alliance request sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send request");
    } finally {
      setBusy(false);
    }
  };

  const acceptRequest = async () => {
    if (!relationship?._id) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await protectedApiRequest({
        url: `/friends/${encodeURIComponent(relationship._id)}`,
        method: "PATCH",
      });
      setInfo("Alliance request accepted");
      const normalized = username.replace(/^@/, "");
      const uid = String(meId ?? "");
      const next = await load(normalized, uid);
      setDev(next.dev);
      setRelationship(next.relationship);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to accept request");
    } finally {
      setBusy(false);
    }
  };

  const rejectRequest = async () => {
    if (!relationship?._id) return;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await protectedApiRequest({
        url: `/friends/${encodeURIComponent(relationship._id)}`,
        method: "DELETE",
      });
      setInfo("Alliance request rejected");
      const normalized = username.replace(/^@/, "");
      const uid = String(meId ?? "");
      const next = await load(normalized, uid);
      setDev(next.dev);
      setRelationship(next.relationship);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reject request");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader label="Loading session…" />;
  if (!user)
    return (
      <RequireLogin
        title="Developer profile"
        message={
          <span className="text-sm">Log in to view developer profiles.</span>
        }
      />
    );

  if (notFound) {
    return (
      <NotFoundState
        title="Developer not found"
        message="This profile doesn’t exist."
        ctaHref="/"
        ctaLabel="Back to feed"
      />
    );
  }

  if (error)
    return <ErrorMsg message={<span className="text-sm">{error}</span>} />;
  if (!dev) return <LoaderBlock />;

  const isMe =
    String(dev.username ?? "").trim() &&
    String(dev.username ?? "").trim() === String(user.username ?? "").trim();

  const displayImage = String(dev.image ?? "").trim();
  const displayName =
    String(dev.name ?? "").trim() || `@${String(dev.username ?? "").trim()}`;
  const displayUsername = String(dev.username ?? "").trim();
  const displayBio = String(dev.bio ?? "").trim();
  const memberSince = String(dev.createdAt ?? "").trim();
  const relStatus = relationship?.status;
  const isIncomingPending =
    relStatus === "pending" &&
    String(relationship?.requesterId ?? "") === String(dev._id) &&
    String(relationship?.recipientId ?? "") === String(meId ?? "");

  return (
    <div className="mx-auto w-full max-w-4xl px-3 sm:px-4 py-6 space-y-4">
      {info ? (
        <SuccessMsg message={<span className="text-sm">{info}</span>} />
      ) : null}

      <section className="overflow-hidden w-xl mx-auto">
        <div className="h-20" />
        <div className="card-body pt-0 -mt-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="avatar">
                <div className="w-20 rounded-full ring ring-base-100 ring-offset-2 ring-offset-base-100 bg-base-200">
                  {displayImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayImage}
                      alt="Developer"
                      className="object-cover"
                    />
                  ) : null}
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold truncate">
                  {displayName}
                </h1>
                {displayUsername ? (
                  <div className="text-sm opacity-70 truncate">
                    @{displayUsername}
                  </div>
                ) : null}
                {displayBio ? (
                  <p className="text-sm mt-2 opacity-90 break-words">
                    {displayBio}
                  </p>
                ) : null}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  {memberSince ? (
                    <span className="badge badge-ghost">
                      Member since {new Date(memberSince).toLocaleDateString()}
                    </span>
                  ) : null}
                  {posts.length ? (
                    <span className="badge badge-outline">
                      {posts.length} posts
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isMe ? (
                <Link className="btn btn-sm btn-outline" href="/profile">
                  My profile
                </Link>
              ) : relationship?.status === "accepted" ? (
                <div className="badge badge-success badge-outline">
                  Alliance
                </div>
              ) : isIncomingPending ? (
                <>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => void acceptRequest()}
                    disabled={busy}
                  >
                    {busy ? "Working…" : "Accept"}
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => void rejectRequest()}
                    disabled={busy}
                  >
                    Reject
                  </button>
                </>
              ) : relationship?.status === "pending" ? (
                <div className="badge badge-warning badge-outline">
                  Request pending
                </div>
              ) : (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => void sendRequest()}
                  disabled={busy}
                >
                  {busy ? "Sending…" : "Send alliance request"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="card-title text-base">Posts</h2>
            <div className="text-xs opacity-60">
              {posts.length ? `${posts.length} total` : null}
            </div>
          </div>

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
              const uname = String(dev.username ?? "").trim();
              const href = uname
                ? `/d/${encodeURIComponent(uname)}/post/${encodeURIComponent(p._id)}`
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
                      {isMe ? (
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
}
