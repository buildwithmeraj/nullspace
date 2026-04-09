import type { Metadata } from "next";
import CreatePostPage from "@/components/pages/profile/CreatePostPage";

export const metadata: Metadata = {
  title: "Create Post",
  description: "Create a new post on NullSpace.",
};

export default function Page() {
  return <CreatePostPage />;
}
