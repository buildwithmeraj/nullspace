"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { protectedApiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import ErrorMsg from "@/components/utilities/Error";
import SuccessMsg from "@/components/utilities/Success";
import RequireLogin from "@/components/auth/RequireLogin";

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

export default function DeveloperProfile({ username }: { username: string }) {
  const { user, loading } = useAuth();
  const [dev, setDev] = useState<PublicUser | null>(null);
  const [relationship, setRelationship] = useState<Friend | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

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

    (async () => {
      if (loading) return;
      if (!user) return;

      try {
        const normalized = username.replace(/^@/, "");
        if (cancelled) return;
        const uid = String(meId ?? "");
        if (!uid) throw new Error("Unauthorized");
        const { dev: nextDev, relationship: nextRel } = await load(
          normalized,
          uid,
        );
        if (cancelled) return;
        setDev(nextDev);
        setRelationship(nextRel);
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

  if (loading) return <div className="opacity-70 text-sm">Loading…</div>;
  if (!user)
    return (
      <RequireLogin
        title="Developer profile"
        message={
          <span className="text-sm">
            Log in to view developer profiles.
          </span>
        }
      />
    );

  if (error) return <ErrorMsg message={<span className="text-sm">{error}</span>} />;
  if (!dev) return <div className="opacity-70 text-sm">Loading profile…</div>;

  const isMe =
    String(dev.username ?? "").trim() &&
    String(dev.username ?? "").trim() === String(user.username ?? "").trim();

  const displayImage = String(dev.image ?? "").trim();
  const relStatus = relationship?.status;
  const isIncomingPending =
    relStatus === "pending" &&
    String(relationship?.requesterId ?? "") === String(dev._id) &&
    String(relationship?.recipientId ?? "") === String(meId ?? "");

  return (
    <div className="mx-auto w-full max-w-4xl px-3 sm:px-4 py-6 space-y-4">
      {info ? <SuccessMsg message={<span className="text-sm">{info}</span>} /> : null}

      <section className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              {displayImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayImage}
                  alt="Developer"
                  className="w-16 h-16 rounded-md object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-md bg-base-200" />
              )}
              <div>
                <h1 className="text-lg font-semibold">{String(dev.name ?? "")}</h1>
                <div className="text-sm opacity-70">@{String(dev.username ?? "")}</div>
                {dev.bio ? <p className="text-sm mt-2">{String(dev.bio)}</p> : null}
              </div>
            </div>

            {isMe ? (
              <Link className="btn btn-sm btn-outline" href="/profile">
                My profile
              </Link>
            ) : relationship?.status === "accepted" ? (
              <div className="badge badge-success badge-outline">Alliance</div>
            ) : isIncomingPending ? (
              <div className="flex items-center gap-2">
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
              </div>
            ) : relationship?.status === "pending" ? (
              <div className="badge badge-warning badge-outline">
                Request pending
              </div>
            ) : (
              <button
                className="btn btn-sm btn-neutral"
                onClick={() => void sendRequest()}
                disabled={busy}
              >
                {busy ? "Sending…" : "Send alliance request"}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
