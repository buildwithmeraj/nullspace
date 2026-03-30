"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { protectedApiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type SearchUser = {
  _id: string;
  name?: string;
  username: string;
  image?: string;
};
type SearchUsersResponse = {
  success?: boolean;
  data?: SearchUser[];
  message?: string;
};

type SearchPostImage = { url: string };
type SearchPostAuthor = {
  _id: string;
  name?: string;
  username?: string;
  image?: string;
} | null;
type SearchPost = {
  _id: string;
  content: string;
  createdAt?: string;
  images?: SearchPostImage[];
  user?: SearchPostAuthor;
};
type SearchPostsResponse = {
  success?: boolean;
  data?: { posts?: SearchPost[] };
  message?: string;
};

export type NavSearchProps = {
  autoFocus?: boolean;
  inputClassName?: string;
  dropdownClassName?: string;
  onNavigate?: () => void;
};

function excerpt(text: string, max = 110) {
  const t = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export default function NavSearch(props: NavSearchProps = {}) {
  // Reused in navbar across breakpoints (desktop inline + mobile overlay).
  const { autoFocus, inputClassName, dropdownClassName, onNavigate } = props;
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();

  const username = String(user?.username ?? "").trim();
  const needsUsername = Boolean(user) && !username;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(Boolean(autoFocus));
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const lastQueryRef = useRef<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const canSearch = !authLoading && Boolean(user) && !needsUsername;
  const trimmed = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!autoFocus) return;
    inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (e.target instanceof Node && root.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!canSearch) return;
    if (!trimmed || trimmed.length < 2) return;

    lastQueryRef.current = trimmed;
    const handle = setTimeout(() => {
      void (async () => {
        const current = trimmed;
        setLoading(true);
        const [u, p] = await Promise.all([
          protectedApiRequest<SearchUsersResponse>({
            url: `/users/search?query=${encodeURIComponent(current)}`,
            method: "GET",
          }).catch(() => null),
          protectedApiRequest<SearchPostsResponse>({
            url: `/posts/search?query=${encodeURIComponent(current)}&limit=5`,
            method: "GET",
          }).catch(() => null),
        ]);

        // Ignore stale responses.
        if (lastQueryRef.current !== current) return;

        setUsers(u?.data ?? []);
        setPosts(p?.data?.posts ?? []);
        setLoading(false);
      })();
    }, 250);

    return () => clearTimeout(handle);
  }, [canSearch, open, trimmed]);

  const showNoResults =
    open &&
    !loading &&
    trimmed.length >= 2 &&
    canSearch &&
    users.length === 0 &&
    posts.length === 0;

  return (
    <div className="relative" ref={rootRef}>
      <input
        type="text"
        placeholder="Search"
        ref={inputRef}
        className={`input input-bordered ${inputClassName ?? "w-48 sm:w-72"}`}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          const next = e.target.value;
          setQuery(next);
          setOpen(true);
          const t = next.trim();
          if (!t || t.length < 2) {
            setUsers([]);
            setPosts([]);
            setLoading(false);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      />

      {open ? (
        <div
          className={`absolute mt-1 rounded-md border border-base-300 bg-base-100 shadow-xl z-50 overflow-hidden ${dropdownClassName ?? "-right-3 w-[20rem] max-w-[90vw]"}`}
        >
          {authLoading ? (
            <div className="p-3 text-sm opacity-70">Checking session…</div>
          ) : !user ? (
            <div className="p-3 text-sm">
              <div className="opacity-70">
                Log in to search users and posts.
              </div>
              <Link
                className="link text-sm"
                href={`/login?next=${encodeURIComponent(pathname ?? "/")}`}
              >
                Go to login
              </Link>
            </div>
          ) : needsUsername ? (
            <div className="p-3 text-sm">
              <div className="opacity-70">Set a username to use search.</div>
              <Link className="link text-sm" href="/profile/edit">
                Complete profile
              </Link>
            </div>
          ) : (
            <>
              <div className="px-3 py-2 text-xs uppercase tracking-wide opacity-60">
                Search
              </div>

              {loading ? (
                <div className="px-3 py-3 text-sm opacity-70">Searching…</div>
              ) : null}

              {users.length ? (
                <>
                  <div className="px-3 pt-2 pb-1 text-xs font-semibold opacity-70">
                    Users
                  </div>
                  <ul className="menu menu-sm">
                    {users.slice(0, 5).map((u) => (
                      <li key={u._id}>
                        <Link
                          href={`/d/${encodeURIComponent(u.username)}`}
                          onClick={() => {
                            setOpen(false);
                            setQuery("");
                            setUsers([]);
                            setPosts([]);
                            setLoading(false);
                            onNavigate?.();
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="avatar">
                              <div className="w-7 rounded-full bg-base-200">
                                {u.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={u.image} alt={u.username} />
                                ) : null}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {String(u.name ?? u.username)}
                              </div>
                              <div className="text-xs opacity-70 truncate">
                                @{u.username}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {posts.length ? (
                <>
                  <div className="px-3 pt-2 pb-1 text-xs font-semibold opacity-70">
                    Posts
                  </div>
                  <ul className="menu menu-sm">
                    {posts.slice(0, 5).map((p) => {
                      const postUsername = String(
                        p.user?.username ?? "",
                      ).trim();
                      const postHref = postUsername
                        ? `/d/${encodeURIComponent(postUsername)}/post/${encodeURIComponent(p._id)}`
                        : `/d/unknown/post/${encodeURIComponent(p._id)}`;
                      return (
                        <li key={p._id}>
                          <Link
                            href={postHref}
                            onClick={() => {
                              setOpen(false);
                              setQuery("");
                              setUsers([]);
                              setPosts([]);
                              setLoading(false);
                              onNavigate?.();
                            }}
                          >
                            <div className="min-w-0">
                              <div className="text-xs opacity-70 truncate">
                                {postUsername ? `@${postUsername}` : "Post"}
                              </div>
                              <div className="text-sm truncate">
                                {excerpt(p.content)}
                              </div>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : null}

              {showNoResults ? (
                <div className="px-3 py-3 text-sm opacity-70">No results.</div>
              ) : null}

              {trimmed.length > 0 && trimmed.length < 2 ? (
                <div className="px-3 py-3 text-xs opacity-40">
                  Type at least 2 characters.
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
