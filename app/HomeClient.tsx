"use client";

import React, { useMemo, useState } from "react";
import CreatePost from "@/components/feed/CreatePost";
import Posts from "@/components/feed/Posts";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PlusSquare } from "lucide-react";
import SuggestedUsers from "@/components/feed/SuggestedUsers";

export default function HomeClient() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  const username = useMemo(
    () => String(user?.username ?? "").trim(),
    [user?.username],
  );
  const name = useMemo(() => String(user?.name ?? "").trim(), [user?.name]);
  const image = useMemo(() => String(user?.image ?? "").trim(), [user?.image]);
  const needsUsername = Boolean(user) && !username;

  return (
    <div className="grid grid-cols-12 gap-4">
      <aside className="hidden md:block md:col-span-4 lg:col-span-3">
        <div className="sticky top-20 space-y-4">
          <section className="card bg-base-100 border border-base-200 shadow-sm transition-shadow hover:shadow-md overflow-hidden">
            <div className="h-14" />
            <div className="card-body pt-0 -mt-7 space-y-3">
              <div className="flex items-center gap-3">
                <div className="avatar">
                  <div className="w-14 rounded-full ring ring-base-100 ring-offset-2 ring-offset-base-100 bg-base-300">
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
                  <div className="font-semibold truncate">
                    {name || username || "Welcome"}
                  </div>
                  {username ? (
                    <div className="text-sm opacity-70 truncate">
                      @{username}
                    </div>
                  ) : (
                    <div className="text-sm opacity-70 truncate">
                      Log in to get started
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {user ? (
                  <>
                    <Link
                      className="btn btn-sm btn-soft btn-info"
                      href="/profile"
                    >
                      View profile
                    </Link>
                    <button
                      type="button"
                      className="btn btn-sm btn-error btn-soft"
                      onClick={() => void logout()}
                      disabled={loading}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link className="btn btn-sm btn-primary" href="/login?next=/">
                    Login
                  </Link>
                )}
              </div>
            </div>
          </section>
          <section className="card bg-base-100 border border-base-200 shadow-sm transition-shadow hover:shadow-md">
            <div className="card-body">
              <h2 className="card-title text-base">Shortcuts</h2>
              <div className="space-y-2">
                {!user ? (
                  <Link
                    className="btn btn-sm btn-outline w-full"
                    href="/login?next=/"
                  >
                    Create post
                  </Link>
                ) : needsUsername ? (
                  <Link
                    className="btn btn-sm btn-outline w-full"
                    href="/profile/edit?reason=complete_profile&next=%2F"
                  >
                    Create post
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary w-full gap-2"
                    onClick={() => setComposerOpen((v) => !v)}
                  >
                    <PlusSquare className="h-4 w-4" />
                    {composerOpen ? "Close composer" : "Create post"}
                  </button>
                )}

                <div className="divider my-1" />
                <ul className="text-sm opacity-80 space-y-1">
                  <li>
                    <Link
                      className="link link-hover"
                      href={user ? "/profile#posts" : "/login?next=%2Fprofile%23posts"}
                    >
                      My posts
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="link link-hover"
                      href={user ? "/profile#friends" : "/login?next=%2Fprofile%23friends"}
                    >
                      Friends
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </aside>

      <main className="col-span-12 md:col-span-8 lg:col-span-6 space-y-4">
        {/* Mobile quick action (since left panel is hidden). */}
        <div className="md:hidden">
          {!user ? (
            <Link className="btn btn-primary w-full" href="/login?next=/">
              Create post
            </Link>
          ) : needsUsername ? (
            <Link
              className="btn btn-primary w-full"
              href="/profile/edit?reason=complete_profile&next=%2F"
            >
              Create post
            </Link>
          ) : (
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={() => setComposerOpen((v) => !v)}
            >
              {composerOpen ? "Close composer" : "Create post"}
            </button>
          )}
        </div>

        {composerOpen ? (
          <CreatePost
            onCreated={() => {
              setRefreshKey((v) => v + 1);
              setComposerOpen(false);
            }}
          />
        ) : null}
        <Posts refreshKey={refreshKey} />
      </main>

      <aside className="hidden lg:block lg:col-span-3">
        <div className="sticky top-20 space-y-4">
          <SuggestedUsers limit={10} />
        </div>
      </aside>
    </div>
  );
}
