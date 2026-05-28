"use client";

import React from "react";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
      <div className="h-16 w-16 rounded-full bg-brand-gradient flex items-center justify-center mb-4 text-white shadow-glow animate-pulse">
        <Settings className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Account Settings</h1>
      <p className="text-sm text-foreground/60 max-w-sm">
        Customize notifications, profile privacy levels, linked platforms, and location settings.
      </p>
    </div>
  );
}
