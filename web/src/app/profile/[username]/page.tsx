import UserProfileClient from "./UserProfileClient";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const resolvedParams = await params;
  return <UserProfileClient username={resolvedParams.username} />;
}
