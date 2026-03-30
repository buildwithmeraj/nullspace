import CreatePost from "@/components/feed/CreatePost";
import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Post",
  description: "Create a new post on NullSpace.",
};

const page = () => {
  return (
    <div>
      <CreatePost />
    </div>
  );
};

export default page;
