"use client";

import React from "react";
import { Archive, Copy, RotateCcw } from "lucide-react";
import { CreatedEventType } from "@/types/event";
import { StatCard } from "@/components/ui/stat-card";
import { fmt, fmtRev } from "../constants";
import { useMyEvents } from "../../layout";

export function ArchivedWorkspace({
  ev,
  onUpdate,
  onDuplicate,
}: {
  ev: CreatedEventType;
  onUpdate: (p: Partial<CreatedEventType>) => void;
  onDuplicate: () => void;
}) {
  const { eventStats } = useMyEvents();
  const stats = eventStats[ev.id] || {
    eventId: ev.id,
    revenue: 0,
    views: 0,
    hype: "0 Hype",
    feedback: [],
  };

  const totalSold = ev.ticketing.tiers.reduce((s, t) => s + t.sold, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Info banner */}
      <div className="p-4 rounded-[16px] bg-white/[0.03] border border-dashed border-white/10 flex items-center gap-3">
        <Archive className="h-5 w-5 text-white/30 shrink-0" />
        <p className="text-[11px] text-white/40 leading-relaxed">
          This event is archived and read-only. You can duplicate it to create a new edition or restore it to active status.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Revenue" value={fmtRev(stats.revenue)} color="text-[var(--brand-3)]" />
        <StatCard label="Tickets Sold" value={String(totalSold)} sub={`of ${ev.ticketing.capacity}`} />
        <StatCard label="Event Views" value={fmt(stats.views)} />
        <StatCard label="Reviews" value={String(stats.feedback.length)} />
      </div>

      {/* Summary */}
      <div className="p-5 rounded-[20px] bg-white/[0.03] border border-white/[0.06]">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-4">Event Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[
            { label: "Date", value: ev.schedule.startDate },
            { label: "Venue", value: ev.location.venue },
            { label: "Category", value: ev.category },
            { label: "Price", value: ev.ticketing.price },
          ].map((row) => (
            <div key={row.label}>
              <span className="text-[8px] font-black uppercase tracking-wider text-white/30 block">{row.label}</span>
              <span className="text-white font-bold">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onDuplicate}
          className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-wider hover:bg-white/10 cursor-pointer transition-all flex items-center justify-center gap-2"
        >
          <Copy className="h-4 w-4" /> Duplicate Event
        </button>
        <button
          onClick={() => onUpdate({ status: "Draft" })}
          className="flex-1 py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-black uppercase tracking-wider shadow-glow hover:scale-[1.02] cursor-pointer transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="h-4 w-4" /> Restore to Draft
        </button>
      </div>
    </div>
  );
}
