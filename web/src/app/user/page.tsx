import { Suspense } from "react";
import UserProfileClient from "./UserProfileClient";
import { useSearchParams } from "next/navigation";

function UserProfileWrapper() {
  const searchParams = useSearchParams();
  const username = searchParams.get("username") || "";

  if (!username) {
    return (
      <main className="flex-1 min-w-0 flex flex-col gap-0 mx-auto w-full items-center justify-center min-h-[50vh]">
        <p className="text-foreground/50">Username not provided.</p>
      </main>
    );
  }

  return <UserProfileClient username={username} />;
}

export default function UserPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 min-w-0 flex flex-col gap-0 mx-auto w-full items-center justify-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-24 w-24 bg-foreground/10 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-foreground/10 rounded mb-2"></div>
        </div>
      </main>
    }>
      <UserProfileWrapper />
    </Suspense>
  );
}
