"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { STATIC_MEDIA_URL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Bell,
  MapPin,
  ChevronDown,
  MessageSquare
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
              src={`${STATIC_MEDIA_URL}/Happnix_logo_full_transparent.svg`}
              alt="Happnix Logo"
              width={360}
              height={100}
              className="w-[100px] h-auto object-contain"
              priority
            />
            {/* <span className="text-2xl font-black tracking-wider text-brand-gradient uppercase hidden sm:inline-block">
              Happnix
            </span> */}
          </Link>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Location Picker */}
          <Button
            id="location-picker-btn"
            onClick={onLocationClick}
            variant="outline"
            size="sm"
            className="rounded-full hover:scale-[1.03] active:scale-[0.98] text-xs font-semibold text-foreground/95 relative h-7 px-3 gap-1.5"
          >
            <MapPin
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: "var(--brand-1)" }}
            />
            <span className="max-w-[80px] sm:max-w-[120px] truncate">
              {currentLocation || "Set Location"}
            </span>
            <ChevronDown className="h-3 w-3 text-foreground/40 shrink-0" />
          </Button>

          {/* Messages (Mobile) */}
          <Link
            href="/messages"
            className="p-2 rounded-full liquid-glass hover:liquid-edge text-foreground/80 hover:text-foreground transition-all md:hidden relative"
            aria-label="Messages"
          >
            <MessageSquare className="h-4 sm:h-5 w-4 sm:w-5" />
            {/* Unread dot indicator */}
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--brand-1)] ring-2 ring-background" />
          </Link>

          {/* Notifications */}
          <Button
            onClick={onNotificationsClick}
            variant="outline"
            size="icon-sm"
            className="rounded-full text-foreground/80 hover:text-foreground relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 sm:h-5 w-4 sm:w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--brand-2)] ring-2 ring-background" />
          </Button>
        </div>
      </div>
    </header>
  );
}
