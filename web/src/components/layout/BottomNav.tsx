"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { NAV_ITEMS } from "@/constants/navConfig";

interface BottomNavProps {
  onCreateClick: () => void;
}

export default function BottomNav({ onCreateClick }: BottomNavProps) {
  const pathname = usePathname();

  // Find config items
  const homeItem = NAV_ITEMS.find(i => i.path === "/home");
  const discoverItem = NAV_ITEMS.find(i => i.path === "/discover");
  const messagesItem = NAV_ITEMS.find(i => i.path === "/messages");
  const profileItem = NAV_ITEMS.find(i => i.path === "/profile");

  const leftTabs = [homeItem, discoverItem].filter(Boolean);
  const rightTabs = [messagesItem, profileItem].filter(Boolean);

  const renderTab = (tab: any, idx: number) => {
    const Icon = tab.icon;
    const isActive = pathname === tab.path;

    return (
      <Link
        key={idx}
        href={tab.path}
        className="flex flex-col items-center justify-center py-1 px-3 relative transition-all"
        title={tab.label}
      >
        <Icon 
          className={`h-5 w-5 transition-all duration-200 ${
            isActive 
              ? "text-[var(--brand-1)] scale-110 drop-shadow-[0_0_8px_rgba(var(--glow-rgb),0.5)]" 
              : "text-foreground/50 hover:text-foreground/85"
          }`} 
        />
        <span className={`text-[10px] mt-0.5 font-medium transition-all ${
          isActive ? "text-foreground opacity-100" : "text-foreground/40 opacity-0 scale-90 h-0 w-0 overflow-hidden"
        }`}>
          {tab.label.split(" ")[0]}
        </span>
        
        {isActive && (
          <span className="absolute bottom-0 w-1 h-1 rounded-full bg-[var(--brand-1)]" />
        )}
      </Link>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden pb-safe-bottom">
      {/* Container with backdrop blur & glass effect */}
      <div className="mx-4 my-3 rounded-2xl liquid-glass liquid-edge px-4 py-2 flex items-center justify-between border border-border shadow-card backdrop-blur-lg">
        {/* Left Side Navigation links */}
        {leftTabs.map((tab, idx) => renderTab(tab, idx))}

        {/* Center Create Button */}
        <button
          onClick={onCreateClick}
          className="flex flex-col items-center justify-center p-2 rounded-full bg-brand-gradient text-white hover:scale-105 active:scale-95 transition-all shadow-glow mx-2 shrink-0"
          aria-label="Create Event"
        >
          <Plus className="h-5 w-5" />
        </button>

        {/* Right Side Navigation links */}
        {rightTabs.map((tab, idx) => renderTab(tab, idx + 2))}
      </div>
    </div>
  );
}
