"use client";

import { useSearchParams } from "next/navigation";
import EventDetailPageClient from "./EventDetailPageClient";

export default function EventDetailWrapper() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  if (!id) {
    return (
      <div className="flex-1 min-w-0 mx-auto w-full flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-foreground/50">Event ID not provided.</p>
      </div>
    );
  }

  return <EventDetailPageClient params={{ id }} />;
}
