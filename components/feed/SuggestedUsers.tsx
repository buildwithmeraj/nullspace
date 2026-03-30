"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCcw } from "lucide-react";

import { protectedApiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Loader from "@/components/utilities/Loader";

type SuggestedUser = {
  _id: string;
  name?: string;
  username?: string;
  image?: string;
  bio?: string;
};

type SuggestionsResponse = {
  success?: boolean;
  message?: string;
  data?: SuggestedUser[];
};

function shuffle<T>(input: T[]) {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function SuggestedUsers({ limit = 10 }: { limit?: number }) {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [busy, setBusy] = useState(false);

  const canLoad = useMemo(() => !loading && Boolean(user), [loading, user]);

  const fetchSuggestions = useCallback(async () => {
    if (!canLoad) return;
    setBusy(true);
    try {
      const res = await protectedApiRequest<SuggestionsResponse>({
        url: `/users/suggestions?limit=${encodeURIComponent(String(limit))}`,
        method: "GET",
      });
      setUsers(shuffle(res?.data ?? []));
    } catch {
      setUsers([]);
    } finally {
      setBusy(false);
    }
  }, [canLoad, limit]);

  useEffect(() => {
    void fetchSuggestions();
  }, [fetchSuggestions]);

  if (!canLoad) {
    return (
      <div className="text-sm opacity-70">
        <Loader label="Loading suggestions…" />
      </div>
    );
  }

  return (
    <section className="card bg-base-100 border border-base-200 shadow-sm">
      <div className="card-body space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="card-title text-base">Suggestions</h2>
          <button
            type="button"
            className="btn btn-xs btn-ghost gap-2"
            onClick={() => void fetchSuggestions()}
            disabled={busy}
            aria-label="Refresh suggestions"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {busy && !users.length ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="skeleton w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-32" />
                  <div className="skeleton h-3 w-24" />
                </div>
                <div className="skeleton h-8 w-20 rounded-btn" />
              </div>
            ))}
          </div>
        ) : users.length ? (
          <div className="space-y-3">
            {users.slice(0, 10).map((u) => {
              const uname = String(u.username ?? "").trim();
              const href = uname ? `/d/${encodeURIComponent(uname)}` : "#";
              return (
                <div key={u._id} className="flex items-center gap-3">
                  <div className="avatar">
                    <div className="w-9 rounded-full bg-base-200">
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.image} alt={uname || "User"} className="object-cover" />
                      ) : null}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {String(u.name ?? uname ?? "Developer")}
                    </div>
                    {uname ? (
                      <div className="text-xs opacity-70 truncate">@{uname}</div>
                    ) : null}
                  </div>

                  {uname ? (
                    <Link className="btn btn-xs btn-outline" href={href}>
                      Connect
                    </Link>
                  ) : (
                    <button className="btn btn-xs btn-outline" disabled>
                      Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm opacity-70">No suggestions right now.</div>
        )}
      </div>
    </section>
  );
}

