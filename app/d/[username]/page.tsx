import DeveloperProfile from "@/components/developer/DeveloperProfile";

export default async function DeveloperProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <DeveloperProfile username={username} />;
}
