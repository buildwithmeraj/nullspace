"use client";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import InfoMsg from "@/components/utilities/Info";

const Profile = () => {
  const { user, loading, logout } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user)
    return (
      <div className="space-y-2">
        <div>Not logged in</div>
        <Link className="link" href="/login">
          Go to login
        </Link>
      </div>
    );
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <section className="card bg-base-100 shadow">
        <div className="card-body space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="card-title">Profile</h1>
              <div className="text-sm opacity-70">{String(user.email ?? "")}</div>
            </div>
            <div className="flex items-center gap-2">
              <Link className="btn btn-sm btn-outline" href="/profile/edit">
                Edit
              </Link>
              <button
                className="btn btn-sm btn-neutral"
                onClick={() => void logout()}
              >
                Logout
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="text-sm">
              <div className="font-semibold">Name</div>
              <div className="opacity-80">{String(user.name ?? "")}</div>
            </div>
            <div className="text-sm">
              <div className="font-semibold">Username</div>
              <div className="opacity-80">{String(user.username ?? "")}</div>
            </div>
            <div className="text-sm">
              <div className="font-semibold">Role</div>
              <div className="opacity-80">{String(user.role ?? "")}</div>
            </div>
            <div className="text-sm">
              <div className="font-semibold">Created</div>
              <div className="opacity-80">{String(user.createdAt ?? "")}</div>
            </div>
          </div>

          {user.image ? (
            <div className="pt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={String(user.image ?? "")}
                alt="Profile"
                className="rounded-md object-cover w-24 h-24"
              />
            </div>
          ) : null}

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
    </div>
  );
};

export default Profile;
