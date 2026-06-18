import { Suspense } from "react";
import EventDetailPageClient from "./EventDetailPageClient";
import { useSearchParams } from "next/navigation";

function EventDetailWrapper() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";

  if (!id) {
    return (
      <div className="flex-1 min-w-0 mx-auto w-full flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-foreground/50">Event ID not provided.</p>
      </div>
    );
  }

  // Passing params object to match the existing component's expected props
  return <EventDetailPageClient params={{ id }} />;
}

export default function EventPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 min-w-0 mx-auto w-full flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-pulse h-16 w-16 bg-foreground/10 rounded-xl mb-4"></div>
      </div>
    }>
      <EventDetailWrapper />
    </Suspense>
  );
}
