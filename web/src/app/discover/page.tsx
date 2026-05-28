"use client";

import React from "react";
import { Compass } from "lucide-react";

export default function DiscoverPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
      <div className="h-16 w-16 rounded-full bg-brand-gradient flex items-center justify-center mb-4 text-white shadow-glow animate-pulse">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Discover Experiences</h1>
      <p className="text-sm text-foreground/60 max-w-sm">
        Explore trending events, squads, and top party spots around Jaipur. This page content is coming soon!
      </p>
    </div>
  );
}
