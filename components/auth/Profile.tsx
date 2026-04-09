"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import InfoMsg from "@/components/utilities/Info";
import RequireLogin from "@/components/auth/RequireLogin";
import Link from "next/link";
import LoaderBlock from "@/components/utilities/LoaderBlock";
import Posts from "@/components/feed/Posts";
import { protectedApiRequest } from "@/lib/api";

type FriendUser = {
  _id: string;
  name?: string;
  username?: string;
  image?: string;
  bio?: string;
} | null;

type FriendRelation = {
  _id: string;
  requesterId: string;
  recipientId: string;
  status: "pending" | "accepted";
  requester?: FriendUser;
  recipient?: FriendUser;
};

type FriendsResponse = {
  success?: boolean;
  message?: string;
  data?: FriendRelation[];
};

const Profile = () => {
  const { user, loading, logout } = useAuth();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "friends">("posts");

  const meId = useMemo(
    () => String(user?.id ?? user?._id ?? "").trim(),
    [user?.id, user?._id],
  );

  useEffect(() => {
    if (!user || !meId) return;

    let cancelled = false;
    setFriendsLoading(true);

    void (async () => {
      try {
        const res = await protectedApiRequest<FriendsResponse>({
          url: "/friends?status=accepted",
          method: "GET",
        });
        if (cancelled) return;

        const items = Array.isArray(res?.data) ? res.data : [];
        const nextFriends = items
          .map((item) => {
            const requesterId = String(item.requesterId ?? "");
            return requesterId === meId ? item.recipient : item.requester;
          })
          .filter((entry): entry is FriendUser => Boolean(entry?._id));

        setFriends(nextFriends);
      } catch {
        if (!cancelled) setFriends([]);
      } finally {
        if (!cancelled) setFriendsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [meId, user]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncTabFromHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash === "friends" || hash === "posts") {
        setActiveTab(hash);
      }
    };

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  if (loading) return <LoaderBlock />;
  if (!user)
    return (
      <RequireLogin
        title="Profile"
        message={<span className="text-sm">Log in to view your profile.</span>}
      />
    );

  const username = String(user.username ?? "").trim();
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
                    <img
                      src={image}
                      alt="Profile"
                      className="object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold truncate">
                  {name || username || "Your profile"}
                </h1>
                {username ? (
                  <div className="text-sm opacity-70 truncate">@{username}</div>
                ) : (
                  <div className="text-sm opacity-70 truncate">{email}</div>
                )}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  {createdAt ? (
                    <span className="badge badge-ghost">
                      Joined {new Date(createdAt).toLocaleDateString()}
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

      <section className="space-y-4">
        <div className="tabs tabs-boxed bg-base-200 inline-flex rounded-xl">
          <button
            type="button"
            className={`tab ${activeTab === "posts" ? "tab-active font-bold text-primary" : ""}`}
            onClick={() => {
              setActiveTab("posts");
              if (typeof window !== "undefined") {
                window.history.replaceState(null, "", "#posts");
              }
            }}
          >
            Posts
          </button>
          <button
            type="button"
            className={`tab ${activeTab === "friends" ? "tab-active font-bold text-primary" : ""}`}
            onClick={() => {
              setActiveTab("friends");
              if (typeof window !== "undefined") {
                window.history.replaceState(null, "", "#friends");
              }
            }}
          >
            Friends
          </button>
        </div>

        {activeTab === "friends" ? (
          <section id="friends" className="space-y-4 scroll-mt-24">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-2xl">Friends</h2>
              <span className="text-sm opacity-60">
                {friendsLoading ? "Loading…" : `${friends.length} total`}
              </span>
            </div>

            {friendsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="card bg-base-100 border border-base-200 shadow-sm"
                  >
                    <div className="card-body flex-row items-center gap-3">
                      <div className="skeleton h-12 w-12 rounded-full shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="skeleton h-4 w-32" />
                        <div className="skeleton h-3 w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : friends.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {friends.map((friend) => {
                  const friendName = String(
                    friend?.name ?? friend?.username ?? "Friend",
                  );
                  const friendUsername = String(friend?.username ?? "").trim();
                  const friendImage = String(friend?.image ?? "").trim();
                  const friendBio = String(friend?.bio ?? "").trim();

                  return (
                    <Link
                      key={String(friend?._id)}
                      href={
                        friendUsername
                          ? `/d/${encodeURIComponent(friendUsername)}`
                          : "/profile"
                      }
                      className="card bg-base-100 border border-base-200 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="card-body flex-row items-center gap-3">
                        <div className="avatar">
                          <div className="w-12 rounded-full bg-base-200">
                            {friendImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={friendImage}
                                  alt={friendName}
                                  className="object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                            ) : null}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate">
                            {friendName}
                          </div>
                          {friendUsername ? (
                            <div className="text-sm opacity-70 truncate">
                              @{friendUsername}
                            </div>
                          ) : null}
                          {friendBio ? (
                            <div className="text-xs opacity-70 line-clamp-2">
                              {friendBio}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <InfoMsg
                message={
                  <span className="text-sm">
                    You don’t have any friends yet. Visit developer profiles and
                    send alliance requests to connect.
                  </span>
                }
              />
            )}
          </section>
        ) : (
          <section id="posts" className="scroll-mt-24">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold text-2xl mb-4">Your posts</h2>
            </div>

            {!username ? (
              <InfoMsg
                message={
                  <span className="text-sm">
                    Set a username to view your posts in a dedicated page.
                  </span>
                }
              />
            ) : (
              <Posts variant="profile" />
            )}
          </section>
        )}
      </section>
    </div>
  );
};

export default Profile;
