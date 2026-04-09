"use client";

import React from "react";

export default function PostSkeleton() {
  return (
    <article className="card bg-base-100 border border-base-200 shadow-sm">
      <div className="card-body space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-36" />
              <div className="skeleton h-3 w-24" />
            </div>
          </div>
          <div className="skeleton h-3 w-24" />
        </div>

        <div className="space-y-2">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
          <div className="skeleton h-4 w-2/3" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="skeleton h-40 w-full rounded-md" />
          <div className="skeleton h-40 w-full rounded-md" />
        </div>

        <div className="flex gap-2">
          <div className="skeleton h-8 w-24 rounded-btn" />
          <div className="skeleton h-8 w-28 rounded-btn" />
        </div>
      </div>
    </article>
  );
}
