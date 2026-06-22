"use client";

import React from "react";
import { Calendar, MapPin, Clock, Copy, ChevronRight, Trash2 } from "lucide-react";
import { CreatedEventType } from "@/types/event";
import { STATUS_CONFIG, fmtRev } from "./constants";
import { useMyEvents } from "../layout";
import { Button } from "@/components/ui/button";

export function EventCard({
  ev,
  onView,
  onDuplicate,
  onDelete,
}: {
  ev: CreatedEventType;
  onView: () => void;
  onDuplicate: () => void;
  onDelete?: () => void;
}) {
  const { eventStats } = useMyEvents();
  const cfg = STATUS_CONFIG[ev.status];
  const StatusIcon = cfg.icon;
  const totalSold = ev.ticketing.tiers.reduce((s, t) => s + t.sold, 0);
  const revenue = eventStats[ev.id]?.revenue ?? 0;

  return (
    <div className="group relative flex flex-col rounded-[16px]  transition-all duration-300">
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
            {onDelete && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Are you sure you want to delete this event?")) {
                    onDelete();
                  }
                }}
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              onClick={onView}
              variant="outline"
              size="sm"
              className="border border-white/10 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
            >
              Manage <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
