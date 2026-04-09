import type { Metadata } from "next";
import PostRoute from "@/components/pages/developer/PostRoute";

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
  return <PostRoute params={params} />;
}
