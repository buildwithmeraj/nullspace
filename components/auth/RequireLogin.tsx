"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import InfoMsg from "@/components/utilities/Info";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  title?: string;
  message?: React.ReactNode;
  nextPath?: string;
};

export default function RequireLogin({
  title = "Login required",
  message,
  nextPath,
}: Props) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const next = nextPath ?? pathname ?? "/";

  useEffect(() => {
    try {
      sessionStorage.setItem("postLoginRedirect", next);
    } catch {
      // ignore
    }
  }, [next]);

  useEffect(() => {
    // If auth resolves after this placeholder rendered, navigate back automatically.
    if (loading) return;
    if (!user) return;
    router.replace(next);
  }, [loading, next, router, user]);

  return (
    <section className="card bg-base-100 shadow">
      <div className="card-body space-y-2">
        <h2 className="card-title text-base">{title}</h2>
        <InfoMsg
          message={
            message ?? (
              <span className="text-sm">You need to log in to continue.</span>
            )
          }
        />
        <div className="card-actions justify-center">
          <Link
            className="btn btn-secondary"
            href={`/login?next=${encodeURIComponent(next)}`}
          >
            Go to login
          </Link>
        </div>
      </div>
    </section>
  );
}
