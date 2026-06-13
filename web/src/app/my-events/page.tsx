"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLayout } from "@/components/layout/AppLayout";
import { Plus, Search, Calendar } from "lucide-react";
import { FILTERS, FilterType } from "./_components/constants";
import { EventCard } from "./_components/EventCard";

export default function MyEventsPage() {
  const router = useRouter();
  const { createdEvents, duplicateCreatedEvent, pendingActiveEventId, clearPendingActiveEventId } = useLayout();
  const [filter, setFilter]           = useState<FilterType>("All");
  const [search, setSearch]           = useState("");
  // Auto-open the newly created Draft after redirect from CreateEventModal
  useEffect(() => {
    if (pendingActiveEventId) {
      router.push(`/my-events/create?id=${pendingActiveEventId}`);
      clearPendingActiveEventId();
    }
  }, [pendingActiveEventId, clearPendingActiveEventId, router]);

  const filtered = useMemo(() =>
    createdEvents.filter((ev) => {
      const matchFilter = filter === "All" || ev.status === filter;
      const matchSearch =
        ev.title.toLowerCase().includes(search.toLowerCase()) ||
        ev.location.venue.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    }),
    [createdEvents, filter, search]
  );

  const counts = useMemo(() => ({
    All:       createdEvents.length,
    Draft:     createdEvents.filter((e) => e.status === "Draft").length,
    Upcoming:  createdEvents.filter((e) => e.status === "Upcoming").length,
    Live:      createdEvents.filter((e) => e.status === "Live").length,
    Completed: createdEvents.filter((e) => e.status === "Completed").length,
    Archived:  createdEvents.filter((e) => e.status === "Archived").length,
  }), [createdEvents]);

  const liveCount = counts.Live;

  // ── Dashboard view ──────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col gap-6 select-none animate-in fade-in duration-300 min-w-0 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[9px] font-black tracking-widest text-[var(--brand-1)] uppercase">Organizer Dashboard</span>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">My Events</h1>
          {liveCount > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-green-400">
                {liveCount} event{liveCount > 1 ? "s" : ""} live right now
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => router.push("/my-events/create")}
          className="px-5 py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-black shadow-glow hover:scale-[1.02] cursor-pointer transition-all uppercase tracking-wider flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Create Event
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by name or venue..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--brand-1)] placeholder-white/20 transition-all"
          />
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto scrollbar-none">
          {FILTERS.map((f) => {
            const cnt = counts[f];
            const isLive = f === "Live" && cnt > 0;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  filter === f ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                }`}
              >
                {isLive && <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />}
                {f} {cnt > 0 && <span className="opacity-60">({cnt})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Grid */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh] liquid-glass liquid-edge rounded-[24px]">
          <div className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white/30">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">No Events Found</h3>
          <p className="text-[11px] text-white/40 mt-1.5 max-w-xs leading-relaxed">
            {search ? `No events matching "${search}"` : "No events in this category yet. Create your first event!"}
          </p>
          {!search && (
            <button
              onClick={() => router.push("/my-events/create")}
              className="mt-5 px-5 py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-black shadow-glow hover:scale-102 cursor-pointer transition-all uppercase tracking-wider flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Create Your First Event
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ev) => (
            <EventCard
              key={ev.id}
              ev={ev}
              onView={() => {
                if (ev.status === "Draft") {
                  router.push(`/my-events/create?id=${ev.id}`);
                } else {
                  router.push(`/my-events/details?id=${ev.id}`);
                }
              }}
              onDuplicate={() => duplicateCreatedEvent(ev.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
