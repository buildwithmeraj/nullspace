import PostDetail from "@/components/feed/PostDetail";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; posturl: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `Post by @${username}`,
    description: `A post by @${username} on NullSpace.`,
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ username: string; posturl: string }>;
}) {
  const { username, posturl } = await params;
  return <PostDetail username={username} postId={posturl} />;
}
