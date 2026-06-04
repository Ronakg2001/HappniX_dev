"use client";

import React from "react";

/**
 * Generic metric stat card.
 * Usage: <StatCard label="Revenue" value="₹12.5L" sub="this month" color="text-green-400" />
 */
export function StatCard({
  label,
  value,
  sub,
  color = "text-white",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="p-4 rounded-[16px] bg-white/[0.03] border border-white/[0.06] flex flex-col gap-1">
      <span className="text-[8px] font-black uppercase tracking-widest text-white/35">{label}</span>
      <span className={`text-xl font-black ${color}`}>{value}</span>
      {sub && <span className="text-[10px] text-white/40">{sub}</span>}
    </div>
  );
}
