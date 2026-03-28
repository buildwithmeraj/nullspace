"use client";

import React, { useState } from "react";
import CreatePost from "@/components/feed/CreatePost";
import Posts from "@/components/feed/Posts";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <CreatePost onCreated={() => setRefreshKey((v) => v + 1)} />
      <Posts refreshKey={refreshKey} />
    </div>
  );
}
