"use client";

import React from "react";
import Link from "next/link";

export default function NotFoundState({
  title = "Page not found",
  message = "The page you’re looking for doesn’t exist (or was moved).",
  ctaHref = "/",
  ctaLabel = "Back to home",
}: {
  title?: string;
  message?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="mx-auto w-full min-h-[72vh] flex items-center justify-center">
      <div className="items-center text-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://res.cloudinary.com/dwicoeqnl/image/upload/v1774867643/uploads/fd43kyqlbpc2vgxlqz5v.png"
          alt="Not found"
          className="w-full max-w-lg"
        />

        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm opacity-70">{message}</p>
        </div>

        <div className="pt-2">
          <Link className="btn btn-primary" href={ctaHref}>
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
