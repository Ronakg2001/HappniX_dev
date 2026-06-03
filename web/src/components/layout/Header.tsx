"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  MapPin,
  ChevronDown
} from "lucide-react";

interface HeaderProps {
  currentLocation: string;
  onLocationClick: () => void;
  onNotificationsClick: () => void;
}

export default function Header({
  currentLocation,
  onLocationClick,
  onNotificationsClick
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full liquid-glass !overflow-visible border-b border-border backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <Link href="/home" className="flex items-center gap-2">
            <Image
              src="https://pub-4c14689c2e3349dd83f26b79045c7c84.r2.dev/Happnix.PNG"
              alt="Happnix Logo"
              width={400}
              height={100}
              className="w-[140px] h-auto object-contain"
              priority
            />
            {/* <span className="text-2xl font-black tracking-wider text-brand-gradient uppercase hidden sm:inline-block">
              Happnix
            </span> */}
          </Link>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Location Picker (Always Visible/Active) */}
          <button
            onClick={onLocationClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass liquid-edge hover:scale-[1.03] active:scale-[0.98] transition-all text-xs font-semibold text-foreground/95"
          >
            <MapPin className="h-3.5 w-3.5 text-[var(--brand-1)]" />
            <span className="max-w-[80px] sm:max-w-none truncate">{currentLocation}</span>
            <ChevronDown className="h-3 w-3 text-foreground/40" />
          </button>

          {/* Notifications */}
          <button
            onClick={onNotificationsClick}
            className="p-2 rounded-full liquid-glass hover:liquid-edge text-foreground/80 hover:text-foreground transition-all relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 sm:h-5 w-4 sm:w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--brand-2)] ring-2 ring-background" />
          </button>
        </div>
      </div>
    </header>
  );
}
