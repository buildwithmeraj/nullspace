"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import InfoMsg from "@/components/utilities/Info";

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
  const pathname = usePathname();
  const next = nextPath ?? pathname ?? "/";

  useEffect(() => {
    try {
      sessionStorage.setItem("postLoginRedirect", next);
    } catch {
      // ignore
    }
  }, [next]);

  return (
    <section className="card bg-base-100 shadow">
      <div className="card-body space-y-2">
        <h2 className="card-title text-base">{title}</h2>
        <InfoMsg
          message={
            message ?? (
              <span className="text-sm">
                You need to log in to continue.
              </span>
            )
          }
        />
        <div className="card-actions justify-end">
          <Link
            className="btn btn-neutral"
            href={`/login?next=${encodeURIComponent(next)}`}
          >
            Go to login
          </Link>
        </div>
      </div>
    </section>
  );
}

