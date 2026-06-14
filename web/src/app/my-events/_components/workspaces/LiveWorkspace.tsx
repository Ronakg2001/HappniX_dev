"use client";

import React, { useState } from "react";
import { Search, Check, CheckCircle2, QrCode, Bell } from "lucide-react";
import { CreatedEventType } from "@/types/event";
import { TabBar } from "@/components/ui/tab-bar";
import { StatCard } from "@/components/ui/stat-card";
import { LIVE_TABS, LiveTab, fmtRev } from "../constants";
import { useMyEvents } from "../../layout";

export function LiveWorkspace({
  ev,
  onUpdate,
}: {
  ev: CreatedEventType;
  onUpdate: (p: Partial<CreatedEventType>) => void;
}) {
  const { eventLiveStates, eventStats, updateEventLiveState } = useMyEvents();
  const [tab, setTab] = useState<LiveTab>("Check-In");
  const [search, setSearch] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

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

  const checkedIn = liveState.attendees.filter((a) => a.checkedIn).length;
  const totalApproved = liveState.attendees.filter((a) => a.status === "Approved").length;

  const simulateScan = () => {
    setScanning(true);
    const pending = liveState.attendees.find((a) => a.status === "Approved" && !a.checkedIn);
    setTimeout(() => {
      if (pending) {
        updateEventLiveState(ev.id, {
          attendees: liveState.attendees.map((a) => (a.id === pending.id ? { ...a, checkedIn: true } : a)),
        });
        setLastScanned(pending.name);
      }
      setScanning(false);
    }, 1500);
  };

  const manualCheckIn = (id: string) => {
    updateEventLiveState(ev.id, {
      attendees: liveState.attendees.map((a) => (a.id === id ? { ...a, checkedIn: true } : a)),
    });
  };

  const toggleSession = (id: string) => {
    updateEventLiveState(ev.id, {
      sessions: liveState.sessions.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
    });
  };

  const sendAnnouncement = () => {
    if (!announcement.trim()) return;
    const newAnn = { id: `ann_${Date.now()}`, content: announcement, timestamp: "Just now", channel: "push" as const };
    updateEventLiveState(ev.id, {
      announcements: [newAnn, ...liveState.announcements],
    });
    setAnnouncement("");
  };

  const markCompleted = () => onUpdate({ status: "Completed" });

  return (
    <div className="flex flex-col gap-4">
      {/* Live Pulse Banner */}
      <div className="flex items-center gap-3 p-3.5 rounded-[16px] bg-green-500/10 border border-green-500/20">
        <span className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse shrink-0 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
        <span className="text-xs font-black text-green-400 uppercase tracking-wider">Event is Live Now</span>
        <span className="ml-auto text-[10px] text-green-400/70">{checkedIn}/{totalApproved} checked in</span>
      </div>

      <TabBar tabs={LIVE_TABS} active={tab} setActive={setTab} />

      {/* ── Check-In ─────────────────────────────────────────────────────────── */}
      {tab === "Check-In" && (
        <div className="flex flex-col gap-4">
          <div className="p-5 rounded-[20px] bg-white/[0.03] border border-white/[0.06] text-center">
            <div className={`mx-auto h-28 w-28 rounded-2xl border-2 flex items-center justify-center mb-4 transition-all duration-300 ${scanning ? "border-green-400 bg-green-400/10 animate-pulse" : "border-white/20 bg-white/[0.03]"}`}>
              {scanning ? <CheckCircle2 className="h-10 w-10 text-green-400" /> : <QrCode className="h-10 w-10 text-white/30" />}
            </div>
            {lastScanned && (
              <div className="flex items-center justify-center gap-2 mb-3 text-green-400 text-xs font-bold">
                <Check className="h-3.5 w-3.5" /> {lastScanned} — Checked In!
              </div>
            )}
            <button
              onClick={simulateScan}
              disabled={scanning}
              className="px-8 py-2.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-black uppercase tracking-wider hover:bg-green-500/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {scanning ? "Scanning..." : "Simulate QR Scan"}
            </button>
          </div>
          <div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search attendee..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--brand-1)] placeholder-white/20 transition-all"
              />
            </div>
            <div className="flex flex-col gap-2">
              {liveState.attendees
                .filter((a) => a.status === "Approved" && (a.name.toLowerCase().includes(search.toLowerCase()) || !search))
                .map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-[12px] bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${a.checkedIn ? "bg-green-500/20 text-green-400 border border-green-500/20" : "bg-white/5 text-white border border-white/10"}`}>
                        {a.checkedIn ? <Check className="h-3.5 w-3.5" /> : a.name[0]}
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-white">{a.name}</p>
                        <p className="text-[9px] text-white/40">{a.ticketType}</p>
                      </div>
                    </div>
                    {!a.checkedIn && (
                      <button onClick={() => manualCheckIn(a.id)} className="px-3 py-1 rounded-lg bg-green-500/15 text-green-400 text-[9px] font-black cursor-pointer hover:bg-green-500/25 transition-all">
                        Check In
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Sessions ─────────────────────────────────────────────────────────── */}
      {tab === "Sessions" && (
        <div className="flex flex-col gap-3">
          {liveState.sessions.map((s) => (
            <div key={s.id} className={`flex items-center gap-3 p-4 rounded-[16px] border transition-all ${s.active ? "bg-green-500/5 border-green-500/20" : "bg-white/[0.03] border-white/[0.06]"}`}>
              <div className={`h-2 w-2 rounded-full shrink-0 ${s.active ? "bg-green-400 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.5)]" : "bg-white/20"}`} />
              <div className="flex-1">
                <p className="text-xs font-black text-white">{s.title}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{s.speaker} · {s.time}</p>
              </div>
              <button
                onClick={() => toggleSession(s.id)}
                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer transition-all ${s.active ? "bg-green-500/20 text-green-400 border border-green-500/20 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/20" : "bg-white/5 text-white/40 border border-white/10 hover:bg-green-500/15 hover:text-green-400"}`}
              >
                {s.active ? "Stop" : "Start"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Announcements ────────────────────────────────────────────────────── */}
      {tab === "Announcements" && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-[16px] bg-white/[0.03] border border-white/[0.06]">
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              rows={2}
              placeholder="Announce something to attendees right now..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--brand-1)] placeholder-white/20 resize-none mb-3 transition-all"
            />
            <button onClick={sendAnnouncement} className="w-full py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-black shadow-glow hover:scale-[1.02] cursor-pointer transition-all flex items-center justify-center gap-2">
              <Bell className="h-4 w-4" /> Push Live Announcement
            </button>
          </div>
          {liveState.announcements.map((a) => (
            <div key={a.id} className="p-3.5 rounded-[14px] bg-white/[0.03] border border-white/[0.06]">
              <p className="text-xs text-white/80">{a.content}</p>
              <span className="text-[9px] text-white/30 mt-1 block">{a.timestamp}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Live Stats ───────────────────────────────────────────────────────── */}
      {tab === "Live Stats" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Checked In" value={String(checkedIn)} sub={`of ${totalApproved} approved`} color="text-green-400" />
            <StatCard label="Capacity Fill" value={`${Math.round((checkedIn / Math.max(ev.ticketing.capacity, 1)) * 100)}%`} color="text-blue-400" />
            <StatCard label="Revenue" value={fmtRev(stats.revenue)} color="text-[var(--brand-3)]" />
            <StatCard label="Live Sessions" value={String(liveState.sessions.filter((s) => s.active).length)} sub="active" />
          </div>
          <button
            onClick={markCompleted}
            className="w-full py-3 rounded-xl bg-purple-600/80 text-white text-xs font-black uppercase tracking-wider hover:scale-[1.02] cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" /> Mark Event as Completed
          </button>
        </div>
      )}
    </div>
  );
}
