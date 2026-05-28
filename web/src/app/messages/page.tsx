"use client";

import React from "react";
import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
      <div className="h-16 w-16 rounded-full bg-brand-gradient flex items-center justify-center mb-4 text-white shadow-glow animate-pulse">
        <MessageSquare className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Squad Chat</h1>
      <p className="text-sm text-foreground/60 max-w-sm">
        Connect with your friends, check who is attending the upcoming gigs, and coordinate your plans.
      </p>
    </div>
  );
}
