"use client";

import React from "react";

/**
 * Generic horizontal scrollable tab bar.
 * Usage: <TabBar tabs={["Overview", "Details"]} active={tab} setActive={setTab} />
 */
export function TabBar<T extends string>({
  tabs,
  active,
  setActive,
}: {
  tabs: readonly T[];
  active: T;
  setActive: (t: T) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActive(tab)}
          className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
            active === tab
              ? "bg-white/10 text-white"
              : "text-white/40 hover:text-white/70 hover:bg-white/5"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
