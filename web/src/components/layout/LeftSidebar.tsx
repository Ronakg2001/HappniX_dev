"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Compass, 
  MessageSquare, 
  Bell, 
  User, 
  Settings, 
  Plus, 
  Calendar,
  LogOut
} from "lucide-react";

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

  const menuItems = [
    { label: "Home Feed", icon: Home, path: "/home" },
    { label: "Discover", icon: Compass, path: "/discover" },
    { label: "My Events", icon: Calendar, path: "/my-events" },
    { label: "Messages", icon: MessageSquare, onClick: onMessagesClick, badge: 3 },
    { label: "Notifications", icon: Bell, onClick: onNotificationsClick, badge: 5 },
    { label: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <aside className="hidden md:flex flex-col justify-between w-[240px] shrink-0 h-[calc(100vh-5rem)] sticky top-20 pb-6">
      <div className="flex flex-col gap-6">
        {/* Main Menu */}
        <nav className="flex flex-col gap-1.5 p-2 rounded-lg liquid-glass liquid-edge">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = item.path ? pathname === item.path : false;

            const content = (
              <span className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${isActive ? 'text-[var(--brand-1)]' : 'text-white/60'}`} />
                <span className="font-semibold text-sm">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 rounded-full bg-[var(--brand-1)] text-white text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </span>
            );

            if (item.onClick) {
              return (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="w-full flex flex-col px-4 py-3 rounded-2xl text-left text-white/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={idx}
                href={item.path || "/home"}
                className={`w-full flex flex-col px-4 py-3 rounded-2xl text-white/70 transition-all ${
                  isActive 
                    ? "bg-white/10 text-white font-bold shadow-glow" 
                    : "hover:text-white hover:bg-white/5"
                }`}
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
        >
          <Plus className="h-5 w-5" />
          Create Event
        </button>
      </div>

      {/* User profile card footer */}
      {/* <div className="rounded-3xl liquid-glass liquid-edge p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-full bg-brand-gradient flex items-center justify-center font-bold text-xs border border-white/10 text-white shrink-0">
            JD
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">John Doe</h4>
            <p className="text-[10px] text-white/40 truncate">@johndoe</p>
          </div>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-all">
          <LogOut className="h-4 w-4" />
        </button>
      </div> */}
    </aside>
  );
}
