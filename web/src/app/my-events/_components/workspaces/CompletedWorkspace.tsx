"use client";

import React, { useState } from "react";
import { Archive, Image } from "lucide-react";
import { CreatedEventType } from "@/types/event";
import { TabBar } from "@/components/ui/tab-bar";
import { StatCard } from "@/components/ui/stat-card";
import { StarRating } from "@/components/ui/star-rating";
import { COMPLETED_TABS, CompletedTab, fmt, fmtRev } from "../constants";
import { useLayout } from "@/components/layout/AppLayout";

export function CompletedWorkspace({
  ev,
  onUpdate,
}: {
  ev: CreatedEventType;
  onUpdate: (p: Partial<CreatedEventType>) => void;
}) {
  const { eventLiveStates, eventStats } = useLayout();
  const [tab, setTab] = useState<CompletedTab>("Analytics");

  const liveState = eventLiveStates[ev.id] || {
    eventId: ev.id,
    registrationOpen: false,
    isPublic: false,
    attendees: [],
    sessions: [],
    speakers: [],
    announcements: [],
    media: [],
  };

  const stats = eventStats[ev.id] || {
    eventId: ev.id,
    revenue: 0,
    views: 0,
    hype: "0 Hype",
    feedback: [],
  };

  const avgRating =
    stats.feedback.length
      ? (stats.feedback.reduce((s, f) => s + f.rating, 0) / stats.feedback.length).toFixed(1)
      : "—";
  const checkedIn = liveState.attendees.filter((a) => a.checkedIn).length;
  const totalSold = ev.ticketing.tiers.reduce((s, t) => s + t.sold, 0);

  const archiveEvent = () => onUpdate({ status: "Archived" });

  return (
    <div className="flex flex-col gap-4">
      <TabBar tabs={COMPLETED_TABS} active={tab} setActive={setTab} />

      {/* ── Analytics ────────────────────────────────────────────────────────── */}
      {tab === "Analytics" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Revenue" value={fmtRev(stats.revenue)} color="text-[var(--brand-3)]" />
            <StatCard label="Tickets Sold" value={String(totalSold)} sub={`of ${ev.ticketing.capacity}`} />
            <StatCard label="Check-In Rate" value={totalSold > 0 ? `${Math.round((checkedIn / totalSold) * 100)}%` : "0%"} color="text-green-400" />
            <StatCard label="Avg Rating" value={String(avgRating)} sub={`${stats.feedback.length} reviews`} color="text-amber-400" />
          </div>
          <div className="p-5 rounded-[20px] bg-white/[0.03] border border-white/[0.06]">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-4">Ticket Performance</h3>
            {ev.ticketing.tiers.map((t) => (
              <div key={t.id} className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-black text-white">{t.name}</span>
                  <span className="text-white/40">{t.sold} sold · ₹{(t.sold * t.price).toLocaleString("en-IN")}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${(t.sold / Math.max(t.inventory, 1)) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={archiveEvent}
            className="flex items-center gap-2 self-start px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-xs font-black cursor-pointer transition-all"
          >
            <Archive className="h-3.5 w-3.5" /> Archive Event
          </button>
        </div>
      )}

      {/* ── Reviews ──────────────────────────────────────────────────────────── */}
      {tab === "Reviews" && (
        <div className="flex flex-col gap-3">
          {stats.feedback.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-xs font-bold">No reviews yet</div>
          ) : (
            <>
              <div className="p-4 rounded-[16px] bg-white/[0.03] border border-white/[0.06] text-center">
                <span className="text-4xl font-black text-white">{avgRating}</span>
                <div className="flex justify-center mt-2 mb-1">
                  <StarRating rating={Math.round(parseFloat(avgRating as string) || 0)} />
                </div>
                <span className="text-[10px] text-white/40">{stats.feedback.length} reviews</span>
              </div>
              {stats.feedback.map((f) => (
                <div key={f.id} className="p-4 rounded-[16px] bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-white">{f.author}</span>
                    <StarRating rating={f.rating} />
                  </div>
                  <p className="text-[11px] text-white/60 leading-relaxed">{f.comment}</p>
                  <span className="text-[9px] text-white/30 mt-2 block">{f.timestamp}</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Media ────────────────────────────────────────────────────────────── */}
      {tab === "Media" && (
        <div className="flex flex-col gap-4">
          {liveState.media.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center p-6 rounded-[20px] bg-white/[0.03] border border-dashed border-white/10">
              <Image className="h-8 w-8 text-white/20 mb-3" />
              <p className="text-xs font-black text-white/40 uppercase tracking-wider">No photos yet</p>
              <p className="text-[10px] text-white/25 mt-1">Upload post-event photos and videos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {liveState.media.map((url, i) => (
                <div key={i} className="aspect-square rounded-[14px] overflow-hidden border border-white/10">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
