"use client";

import React from "react";
import { Ticket } from "lucide-react";

export default function MyEventsPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
      <div className="h-16 w-16 rounded-full bg-brand-gradient flex items-center justify-center mb-4 text-white shadow-glow animate-pulse">
        <Ticket className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">My Booked Events</h1>
      <p className="text-sm text-foreground/60 max-w-sm">
        View all the upcoming experiences you are attending, download QR entry passes, or manage events you host.
      </p>
    </div>
  );
}
