"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { NAV_ITEMS } from "@/constants/navConfig";

interface LeftSidebarProps {
  onCreateClick: () => void;
  onNotificationsClick: () => void;
  onMessagesClick: () => void;
}

export default function LeftSidebar({
  onCreateClick,
  onNotificationsClick,
  onMessagesClick
}: LeftSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-[80px] xl:w-[260px] shrink-0 sticky top-20 pb-6 self-start transition-all duration-300">
      <div className="flex flex-col gap-6">
        {/* Main Menu */}
        <nav className="flex flex-col gap-1.5 p-2 rounded-lg liquid-glass liquid-border">
          {NAV_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;

            const isNotification = item.label === "Notifications";
            const isMessage = item.label === "Messages";

            let clickHandler: (() => void) | undefined = undefined;
            if (isNotification) clickHandler = onNotificationsClick;
            if (isMessage) clickHandler = onMessagesClick;

            const content = (
              <span className="flex items-center gap-3 justify-center xl:justify-start">
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-[var(--brand-1)]' : 'text-foreground/60'}`} />
                <span className="font-semibold text-sm hidden xl:inline truncate">{item.label}</span>
                {item.badgeKey && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-[var(--brand-1)] text-white text-[10px] font-bold hidden xl:inline">
                    {item.badgeKey === "messagesCount" ? 3 : 5}
                  </span>
                )}
              </span>
            );

            if (clickHandler) {
              return (
                <button
                  key={idx}
                  onClick={clickHandler}
                  className={`w-full flex flex-col px-4 py-3 rounded-2xl text-center xl:text-left text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-all cursor-pointer ${
                    isActive ? "bg-foreground/10 text-foreground font-bold shadow-glow" : ""
                  }`}
                  title={item.label}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={idx}
                href={item.path}
                className={`w-full flex flex-col px-4 py-3 rounded-2xl text-foreground/70 transition-all ${
                  isActive 
                    ? "bg-foreground/10 text-foreground font-bold shadow-glow" 
                    : "hover:text-foreground hover:bg-foreground/5"
                }`}
                title={item.label}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Create Event CTA */}
        <button
          onClick={onCreateClick}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-brand-gradient text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow text-sm"
          title="Create Event"
        >
          <Plus className="h-5 w-5 shrink-0" />
          <span className="hidden xl:inline">Create Event</span>
        </button>
      </div>
    </aside>
  );
}
