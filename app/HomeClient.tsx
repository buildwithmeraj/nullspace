"use client";

import React, { useState } from "react";
import CreatePost from "@/components/feed/CreatePost";
import Posts from "@/components/feed/Posts";

export default function HomeClient() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="grid grid-cols-12 gap-4">
      <aside className="hidden md:block md:col-span-4 lg:col-span-3">
        <div className="sticky top-20 space-y-4">
          <section className="card bg-base-100 border border-base-200 shadow-sm transition-shadow hover:shadow-md">
            <div className="card-body">
              <h2 className="card-title text-base">Profile</h2>
              <p className="text-sm opacity-70">
                Your info and quick actions will live here.
              </p>
            </div>
          </section>
          <section className="card bg-base-100 border border-base-200 shadow-sm transition-shadow hover:shadow-md">
            <div className="card-body">
              <h2 className="card-title text-base">Shortcuts</h2>
              <ul className="text-sm opacity-80 space-y-1">
                <li>My posts</li>
                <li>Friends</li>
                <li>Saved</li>
              </ul>
            </div>
          </section>
        </div>
      </aside>

      <main className="col-span-12 md:col-span-8 lg:col-span-6 space-y-4">
        <CreatePost onCreated={() => setRefreshKey((v) => v + 1)} />
        <Posts refreshKey={refreshKey} />
      </main>

      <aside className="hidden lg:block lg:col-span-3">
        <div className="sticky top-20 space-y-4">
          <section className="card bg-base-100 border border-base-200 shadow-sm transition-shadow hover:shadow-md">
            <div className="card-body">
              <h2 className="card-title text-base">Trending</h2>
              <ul className="text-sm opacity-80 space-y-1">
                <li>#typescript</li>
                <li>#nextjs</li>
                <li>#mongodb</li>
              </ul>
            </div>
          </section>
          <section className="card bg-base-100 border border-base-200 shadow-sm transition-shadow hover:shadow-md">
            <div className="card-body">
              <h2 className="card-title text-base">Suggestions</h2>
              <p className="text-sm opacity-70">
                Friend suggestions can be shown here.
              </p>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
