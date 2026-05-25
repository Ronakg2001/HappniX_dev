"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Bell, 
  MessageSquare, 
  MapPin, 
  User, 
  Plus, 
  ChevronDown,
  LogOut,
  Settings,
  Compass,
  Palette,
  Home
} from "lucide-react";
import { useTheme, THEMES, type ThemeId } from "@/lib/ThemeContext";

interface HeaderProps {
  currentLocation: string;
  onLocationClick: () => void;
  onNotificationsClick: () => void;
  onMessagesClick: () => void;
  onCreateClick: () => void;
}

export default function Header({
  currentLocation,
  onLocationClick,
  onNotificationsClick,
  onMessagesClick,
  onCreateClick
}: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
        setThemePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full liquid-glass !overflow-visible border-b border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <Link href="/home" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-wider text-brand-gradient uppercase">
              Happnix
            </span>
          </Link>

          {/* Desktop Navigation Shortcuts */}
          <nav className="hidden md:flex items-center gap-1 ml-8">
            <Link 
              href="/home" 
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                pathname === "/home" 
                  ? "bg-white/10 text-white shadow-glow" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              Feed
            </Link>
            <Link 
              href="/discover" 
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                pathname === "/discover" 
                  ? "bg-white/10 text-white" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              Discover
            </Link>
            <Link 
              href="/events" 
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                pathname === "/events" 
                  ? "bg-white/10 text-white" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              Events
            </Link>
          </nav>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Location Picker (Always Visible/Active) */}
          <button 
            onClick={onLocationClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass liquid-edge hover:scale-[1.03] active:scale-[0.98] transition-all text-xs font-semibold text-white/95"
          >
            <MapPin className="h-3.5 w-3.5 text-[var(--brand-1)]" />
            <span className="max-w-[80px] sm:max-w-none truncate">{currentLocation}</span>
            <ChevronDown className="h-3 w-3 text-white/40" />
          </button>

          {/* Create Button (Desktop only, FAB is for Mobile) */}
          <button
            onClick={onCreateClick}
            className="hidden md:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-gradient text-white text-xs font-bold hover:scale-[1.03] active:scale-[0.98] transition-all shadow-glow hover:shadow-[0_0_20px_rgba(var(--glow-rgb),0.5)]"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </button>

          {/* Messages */}
          <button 
            onClick={onMessagesClick}
            className="p-2 rounded-full liquid-glass hover:liquid-edge text-white/80 hover:text-white transition-all relative"
            aria-label="Messages"
          >
            <MessageSquare className="h-4 sm:h-5 w-4 sm:w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--brand-1)] ring-2 ring-black" />
          </button>

          {/* Notifications */}
          <button 
            onClick={onNotificationsClick}
            className="p-2 rounded-full liquid-glass hover:liquid-edge text-white/80 hover:text-white transition-all relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 sm:h-5 w-4 sm:w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--brand-2)] ring-2 ring-black" />
          </button>

          {/* User Profile / Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1 p-1 pl-1.5 pr-2 rounded-full liquid-glass hover:liquid-edge transition-all"
            >
              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-brand-gradient flex items-center justify-center font-bold text-xs border border-white/20">
                JD
              </div>
              <ChevronDown className="h-3 w-3 text-white/40" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg bg-black border border-white/10 p-2 shadow-card backdrop-blur-2xl animate-in fade-in-50 slide-in-from-top-3 duration-200">
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-xs text-white/50">Signed in as</p>
                  <p className="text-sm font-semibold truncate text-white">John Doe</p>
                </div>

                <div className="py-1">
                  <Link 
                    href="/profile/johndoe" 
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/85 hover:bg-white/5 transition-all"
                  >
                    <User className="h-4 w-4 text-white/60" />
                    My Profile
                  </Link>

                  <button 
                    onClick={() => {
                      setThemePickerOpen(!themePickerOpen);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm text-white/85 hover:bg-white/5 transition-all text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-white/60" />
                      Theme: {theme.name}
                    </span>
                    <ChevronDown className={`h-3 w-3 text-white/40 transition-transform ${themePickerOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {themePickerOpen && (
                    <div className="px-2 py-1 flex flex-col gap-1 border-t border-white/5 mt-1">
                      {THEMES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTheme(t.id);
                            setProfileDropdownOpen(false);
                            setThemePickerOpen(false);
                          }}
                          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-all ${
                            t.id === theme.id 
                              ? 'bg-white/10 text-white font-medium' 
                              : 'text-white/60 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span 
                            className="h-3 w-3 rounded-full border border-white/10" 
                            style={{ background: t.swatch }}
                          />
                          {t.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <Link 
                    href="/settings" 
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/85 hover:bg-white/5 transition-all"
                  >
                    <Settings className="h-4 w-4 text-white/60" />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-white/10 pt-1 mt-1">
                  <button 
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all text-left"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
