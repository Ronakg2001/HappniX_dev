"use client";
import { useState, useRef, useEffect } from "react";
import { useTheme, THEMES, type ThemeId } from "@/lib/ThemeContext";

export default function ThemeChanger() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
      {/* Theme swatches panel */}
      <div
        className={`flex flex-col gap-2.5 transition-all duration-300 origin-bottom-right ${
          open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-90 pointer-events-none"
        }`}
      >
        {/* Label */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40 text-right pr-1 mb-1">
          Theme
        </p>
        {THEMES.map((t) => {
          const active = t.id === theme.id;
          return (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id as ThemeId); setOpen(false); }}
              title={t.name}
              className={`group flex items-center gap-3 rounded-full pl-3 pr-4 py-2 transition-all duration-200
                ${active
                  ? "liquid-glass liquid-edge shadow-glow scale-[1.03]"
                  : "liquid-glass hover:liquid-edge hover:scale-[1.02]"
                }`}
            >
              {/* Swatch circle */}
              <span
                className="h-5 w-5 rounded-full shrink-0 ring-1 ring-white/20"
                style={{ background: t.swatch }}
              />
              <span className={`text-[13px] font-medium whitespace-nowrap transition-colors duration-200 ${
                active ? "text-white" : "text-white/55 group-hover:text-white/80"
              }`}>
                {t.name}
              </span>
              {active && (
                <span className="text-[11px] text-white/50 ml-auto">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        title="Change theme"
        className="relative h-12 w-12 rounded-full liquid-glass liquid-edge overflow-hidden group transition-all duration-200 hover:scale-105 hover:shadow-glow"
        aria-label="Change color theme"
      >
        {/* Gradient circle inside */}
        <span
          className="absolute inset-[3px] rounded-full transition-all duration-300"
          style={{ background: theme.swatch }}
        />
        {/* Shimmer */}
        <span
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ animation: open ? "shimmer 2s ease-in-out infinite" : "none" }}
        />
        {/* Icon */}
        <span className="absolute inset-0 flex items-center justify-center text-[18px]" style={{ filter: "drop-shadow(0 0 4px rgba(0,0,0,0.8))" }}>
          🎨
        </span>
      </button>
    </div>
  );
}
