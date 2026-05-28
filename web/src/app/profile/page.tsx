"use client";

import React from "react";
import { User } from "lucide-react";

export default function JohnDoeProfilePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
      <div className="h-16 w-16 rounded-full bg-brand-gradient flex items-center justify-center mb-4 text-white shadow-glow animate-pulse">
        <User className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">John Doe</h1>
      <p className="text-sm text-foreground/60 max-w-sm">
        @johndoe • Verified Explorer. Manage your posts, shared photos, and booked event passes here.
      </p>
    </div>
  );
}
