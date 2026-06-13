"use client";

import React from "react";
import { Calendar, MapPin, Clock, Copy, ChevronRight } from "lucide-react";
import { CreatedEventType } from "@/types/event";
import { STATUS_CONFIG, fmtRev } from "./constants";
import { useLayout } from "@/components/layout/AppLayout";

export function EventCard({
  ev,
  onView,
  onDuplicate,
}: {
  ev: CreatedEventType;
  onView: () => void;
  onDuplicate: () => void;
}) {
  const { eventStats } = useLayout();
  const cfg = STATUS_CONFIG[ev.status];
  const StatusIcon = cfg.icon;
  const totalSold = ev.ticketing.tiers.reduce((s, t) => s + t.sold, 0);
  const revenue = eventStats[ev.id]?.revenue ?? 0;

  return (
    <div className="group relative flex flex-col rounded-[20px] overflow-hidden border border-white/10 bg-gradient-to-b from-[#14141d] to-[#08080c] hover:border-white/20 hover:shadow-[0_0_30px_rgba(201,108,255,0.12)] transition-all duration-300">
      {/* Banner */}
      <div className="relative w-full h-36 bg-black/40 overflow-hidden shrink-0">
        <img
          src={ev.bannerUrl}
          alt={ev.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-black/40 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border backdrop-blur-md shadow-[0_2px_12px_rgba(0,0,0,0.5)] ${cfg.cardBadge}`}>
            {ev.status === "Live" && (
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} animate-pulse shadow-[0_0_6px_currentColor]`} />
            )}
            <StatusIcon className="h-2.5 w-2.5" />
            {ev.status}
          </span>
        </div>

        {/* Category badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-wider border border-white/10">
            {ev.category}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <h4 className="text-xs font-black text-white leading-tight uppercase tracking-wide line-clamp-2 min-h-[32px] group-hover:text-[var(--brand-2)] transition-colors">
          {ev.title}
        </h4>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-bold">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{ev.location.venue}</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-white/40 font-bold">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{ev.schedule.startDate}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ev.schedule.startTime}</span>
          </div>
        </div>

        {/* Stats + Actions */}
        <div className="border-t border-white/5 pt-3 flex items-center justify-between">
          <div className="flex gap-4">
            <div>
              <span className="text-[7px] font-black uppercase tracking-wider text-white/30 block">Registrations</span>
              <span className="text-xs font-black text-white">{totalSold} / {ev.ticketing.capacity}</span>
            </div>
            {ev.status !== "Draft" && (
              <div>
                <span className="text-[7px] font-black uppercase tracking-wider text-white/30 block">Revenue</span>
                <span className="text-xs font-black text-[var(--brand-3)]">{fmtRev(revenue)}</span>
              </div>
            )}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={onDuplicate}
              title="Duplicate"
              className="h-7 w-7 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <Copy className="h-3 w-3" />
            </button>
            <button
              onClick={onView}
              className="px-3 h-7 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
            >
              Manage <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
