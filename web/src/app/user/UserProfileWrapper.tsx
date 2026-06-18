"use client";

import { useSearchParams } from "next/navigation";
import UserProfileClient from "./UserProfileClient";

export default function UserProfileWrapper() {
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
