import { Suspense } from "react";
import EventDetailWrapper from "./EventDetailWrapper";

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
