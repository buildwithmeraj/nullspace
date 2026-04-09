import type { Metadata } from "next";
import DeveloperProfileRoute from "@/components/pages/developer/DeveloperProfileRoute";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `@${username}`,
    description: `Developer profile for @${username} on NullSpace.`,
  };
}

export default async function DeveloperProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return <DeveloperProfileRoute params={params} />;
}
