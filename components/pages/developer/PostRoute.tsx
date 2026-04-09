import PostDetail from "@/components/feed/PostDetail";

export default async function PostRoute({
  params,
}: {
  params: Promise<{ username: string; posturl: string }>;
}) {
  const { username, posturl } = await params;
  return <PostDetail username={username} postId={posturl} />;
}
