"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, PenTool, Calendar, Video, Image, X } from "lucide-react";

interface FABProps {
  onCreateEventClick: () => void;
}

export default function FloatingActionButton({ onCreateEventClick }: FABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const items = [
    { label: "Create Event", icon: Calendar, onClick: () => { onCreateEventClick(); setIsOpen(false); }, color: "bg-[var(--brand-1)]" },
    { label: "New Post", icon: PenTool, onClick: () => { alert("Post creation triggered"); setIsOpen(false); }, color: "bg-[var(--brand-2)]" },
    { label: "Upload Media", icon: Image, onClick: () => { alert("Media upload triggered"); setIsOpen(false); }, color: "bg-[var(--brand-3)]" },
    { label: "Go Live", icon: Video, onClick: () => { alert("Live session triggered"); setIsOpen(false); }, color: "bg-[var(--brand-4)]" },
  ];

  return (
    <div ref={fabRef} className="fixed bottom-20 right-6 z-45 md:hidden flex flex-col items-end gap-3">
      {/* Expanded Menu Options */}
      {isOpen && (
        <div className="flex flex-col gap-2.5 items-end animate-in slide-in-from-bottom-5 duration-200">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={item.onClick}
                className="flex items-center gap-3 pl-3 pr-4 py-2 rounded-full liquid-glass liquid-edge hover:scale-102 active:scale-95 transition-all text-xs font-bold text-white shadow-card"
              >
                <span className={`h-6 w-6 rounded-full flex items-center justify-center text-white ${item.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main FAB Trigger */}
      <button
        onClick={() => {
          // Play a simulated click haptic
          if (navigator.vibrate) {
            navigator.vibrate(10);
          }
          setIsOpen(!isOpen);
        }}
        className={`h-14 w-14 rounded-full bg-brand-gradient text-white flex items-center justify-center shadow-glow transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen ? "rotate-45" : ""
        }`}
        aria-label="Toggle actions menu"
      >
        <Plus className="h-7 w-7" />
      </button>
    </div>
  );
}
