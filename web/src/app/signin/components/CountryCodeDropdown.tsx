"use client";

import { useEffect, useRef, useState } from "react";

export interface CountryInfo {
  name: string;
  region_code: string;
  dial_code: string;
  mobile_number_pattern: string;
  region_flag: string;
}

interface Props {
  countries: CountryInfo[];
  selected: CountryInfo;
  onChange: (c: CountryInfo) => void;
}

export default function CountryCodeDropdown({ countries, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.dial_code.includes(search) ||
    c.region_code.toLowerCase().includes(search.toLowerCase())
  );

  function select(c: CountryInfo) {
    onChange(c);
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={ref} className="relative flex-shrink-0" style={{ width: "96px" }}>
      {/* Trigger button */}
      <button
        type="button"
        id="country-code-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
        className={[
          "flex items-center justify-center gap-1 h-full w-full",
          "liquid-glass liquid-edge rounded-[14px] px-2.5 py-3.5",
          "text-[15px] text-white transition-all duration-200",
          "hover:border-[#FF4FD8]/40",
          open ? "border-[#FF4FD8]/50 shadow-glow" : "",
        ].join(" ")}
        style={{ minHeight: "52px" }}
      >
        <span className="text-[20px] leading-none">{selected.region_flag}</span>
        <span className="text-[13px] font-semibold text-white/80 tabular-nums">
          {selected.dial_code}
        </span>
        {/* Chevron */}
        <svg
          className={`w-3 h-3 text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 10 6"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          aria-label="Select country code"
          className={[
            "absolute left-0 z-50 mt-2 w-[260px]",
            "liquid-glass liquid-edge rounded-[18px] p-2",
            "animate-in fade-in slide-in-from-top-2 duration-200",
          ].join(" ")}
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.12) 100%)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.18)",
          }}
        >
          {/* Search */}
          <div className="px-2 pb-2 pt-1">
            <input
              autoFocus
              type="text"
              placeholder="Search country…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={[
                "w-full bg-white/[0.07] border border-white/10 rounded-[10px]",
                "px-3 py-2 text-[13px] text-white placeholder:text-white/25",
                "outline-none focus:border-[#FF4FD8]/50 transition-all duration-150",
              ].join(" ")}
            />
          </div>

          {/* Country list */}
          <ul
            className="max-h-[200px] overflow-y-auto pr-0.5 custom-scrollbar"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.15) transparent" }}
          >
            {filtered.length === 0 && (
              <li className="text-[13px] text-white/30 text-center py-4">No match</li>
            )}
            {filtered.map((c) => {
              const isActive = c.region_code === selected.region_code;
              return (
                <li key={c.region_code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => select(c)}
                    className={[
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px]",
                      "text-left transition-all duration-150 group",
                      isActive
                        ? "bg-[#FF4FD8]/15 text-white"
                        : "text-white/70 hover:bg-white/[0.07] hover:text-white",
                    ].join(" ")}
                  >
                    {/* Flag */}
                    <span className="text-[20px] leading-none flex-shrink-0">{c.region_flag}</span>
                    {/* Name */}
                    <span className="flex-1 text-[13px] font-medium truncate">{c.name}</span>
                    {/* Dial code */}
                    <span
                      className={`text-[12px] tabular-nums flex-shrink-0 ${
                        isActive ? "text-[#FF4FD8]" : "text-white/35 group-hover:text-white/60"
                      }`}
                    >
                      {c.dial_code}
                    </span>
                    {isActive && (
                      <svg className="w-3.5 h-3.5 text-[#FF4FD8] flex-shrink-0" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
