"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Compass, 
  Plus, 
  Calendar, 
  User 
} from "lucide-react";

interface BottomNavProps {
  onCreateClick: () => void;
}

export default function BottomNav({ onCreateClick }: BottomNavProps) {
  const pathname = usePathname();

  const tabs = [
    { label: "Home", icon: Home, path: "/home" },
    { label: "Discover", icon: Compass, path: "/discover" },
    { label: "Create", icon: Plus, isButton: true },
    { label: "My Events", icon: Calendar, path: "/my-events" },
    { label: "Profile", icon: User, path: "/profile/johndoe" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden pb-safe-bottom">
      {/* Container with backdrop blur & glass effect */}
      <div className="mx-4 my-3 rounded-2xl liquid-glass liquid-edge px-4 py-2 flex items-center justify-between border border-white/10 shadow-card backdrop-blur-lg">
        {tabs.map((tab, idx) => {
          const isActive = tab.path ? pathname === tab.path : false;
          const Icon = tab.icon;

          if (tab.isButton) {
            return (
              <button
                key={idx}
                onClick={onCreateClick}
                className="flex flex-col items-center justify-center p-2 rounded-full bg-brand-gradient text-white hover:scale-105 active:scale-95 transition-all shadow-glow"
                aria-label="Create Event"
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          }

          return (
            <Link
              key={idx}
              href={tab.path || "/home"}
              className="flex flex-col items-center justify-center py-1 px-3 relative transition-all"
            >
              <Icon 
                className={`h-5 w-5 transition-all duration-200 ${
                  isActive 
                    ? "text-[var(--brand-1)] scale-110 drop-shadow-[0_0_8px_rgba(var(--glow-rgb),0.5)]" 
                    : "text-white/50 hover:text-white/85"
                }`} 
              />
              <span className={`text-[10px] mt-0.5 font-medium transition-all ${
                isActive ? "text-white opacity-100" : "text-white/40 opacity-0 scale-90 h-0 w-0 overflow-hidden"
              }`}>
                {tab.label}
              </span>
              
              {isActive && (
                <span className="absolute bottom-0 w-1 h-1 rounded-full bg-[var(--brand-1)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
