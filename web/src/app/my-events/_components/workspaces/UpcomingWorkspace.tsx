"use client";

import React, { useState } from "react";
import { Search, Check, X, Radio, ToggleLeft, ToggleRight, Send } from "lucide-react";
import { CreatedEventType, AttendeeType } from "@/components/layout/AppLayout";
import { TabBar } from "@/components/ui/tab-bar";
import { StatCard } from "@/components/ui/stat-card";
import { UPCOMING_TABS, UpcomingTab, fmt, fmtRev } from "../constants";

export function UpcomingWorkspace({
  ev,
  onUpdate,
}: {
  ev: CreatedEventType;
  onUpdate: (p: Partial<CreatedEventType>) => void;
}) {
  const [tab, setTab] = useState<UpcomingTab>("Overview");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const [announcement, setAnnouncement] = useState("");
  const [channel, setChannel] = useState<"email" | "push" | "both">("both");
  const [msgSent, setMsgSent] = useState(false);

  const totalSold = ev.tickets.reduce((s, t) => s + t.sold, 0);
  const totalRevenue = ev.tickets.reduce((s, t) => s + t.price * t.sold, 0);

  const filteredAttendees = ev.attendees.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === "All" || a.status === filterStatus;
    return matchSearch && matchFilter;
  });

  const updateAttendeeStatus = (id: string, status: AttendeeType["status"]) => {
    onUpdate({ attendees: ev.attendees.map((a) => (a.id === id ? { ...a, status } : a)) });
  };

  const toggleTicketPause = (id: string) => {
    onUpdate({ tickets: ev.tickets.map((t) => (t.id === id ? { ...t, paused: !t.paused } : t)) });
  };

  const sendAnnouncement = () => {
    if (!announcement.trim()) return;
    const newAnn = { id: `ann_${Date.now()}`, content: announcement, timestamp: "Just now", channel };
    onUpdate({ announcements: [newAnn, ...ev.announcements] });
    setAnnouncement("");
    setMsgSent(true);
    setTimeout(() => setMsgSent(false), 2000);
  };

  const goLive = () => onUpdate({ status: "Live" });

  return (
    <div className="flex flex-col gap-4">
      <TabBar tabs={UPCOMING_TABS} active={tab} setActive={setTab} />

      {/* ── Overview ─────────────────────────────────────────────────────────── */}
      {tab === "Overview" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Registrations" value={`${totalSold}`} sub={`of ${ev.capacity}`} />
            <StatCard label="Revenue" value={fmtRev(totalRevenue)} color="text-[var(--brand-3)]" />
            <StatCard label="Capacity Fill" value={`${Math.round((totalSold / ev.capacity) * 100)}%`} color="text-blue-400" />
            <StatCard label="Views" value={fmt(ev.views)} sub="event page" />
          </div>
          <div className="p-5 rounded-[20px] bg-white/[0.03] border border-white/[0.06]">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-4">Ticket Sales Breakdown</h3>
            <div className="flex flex-col gap-3">
              {ev.tickets.map((t) => {
                const pct = t.inventory > 0 ? Math.round((t.sold / t.inventory) * 100) : 0;
                return (
                  <div key={t.id}>
                    <div className="flex justify-between items-center text-xs text-white/70 mb-1.5">
                      <span className="font-bold">{t.name}</span>
                      <span className="text-white/40 font-bold">{t.sold}/{t.inventory} — ₹{t.price}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="p-5 rounded-[20px] bg-white/[0.03] border border-white/[0.06]">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-3">Event Info</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: "Date", value: ev.date },
                { label: "Time", value: `${ev.time} – ${ev.endTime}` },
                { label: "Venue", value: ev.venue },
                { label: "Visibility", value: ev.isPublic ? "Public" : "Private" },
              ].map((row) => (
                <div key={row.label}>
                  <span className="text-[8px] font-black uppercase tracking-wider text-white/30 block">{row.label}</span>
                  <span className="text-white font-bold">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={goLive}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Radio className="h-4 w-4 animate-pulse" /> Mark Event as Live
          </button>
        </div>
      )}

      {/* ── Attendees ────────────────────────────────────────────────────────── */}
      {tab === "Attendees" && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 relative min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search attendees..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--brand-1)] placeholder-white/20 transition-all"
              />
            </div>
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-0.5">
              {(["All", "Pending", "Approved", "Rejected"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${filterStatus === s ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {filteredAttendees.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-xs font-bold">No attendees found</div>
            ) : (
              filteredAttendees.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3.5 rounded-[14px] bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-brand-gradient/20 border border-white/10 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                        {a.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">{a.name}</p>
                        <p className="text-[10px] text-white/40">{a.email} · {a.ticketType}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${a.status === "Approved" ? "bg-green-500/15 text-green-400 border-green-500/20" : a.status === "Rejected" ? "bg-red-500/15 text-red-400 border-red-500/20" : "bg-amber-500/15 text-amber-400 border-amber-500/20"}`}>
                      {a.status}
                    </span>
                    {a.status === "Pending" && (
                      <div className="flex gap-1">
                        <button onClick={() => updateAttendeeStatus(a.id, "Approved")} className="h-6 w-6 rounded-lg bg-green-500/15 hover:bg-green-500/25 text-green-400 flex items-center justify-center cursor-pointer transition-all">
                          <Check className="h-3 w-3" />
                        </button>
                        <button onClick={() => updateAttendeeStatus(a.id, "Rejected")} className="h-6 w-6 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 flex items-center justify-center cursor-pointer transition-all">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Schedule ─────────────────────────────────────────────────────────── */}
      {tab === "Schedule" && (
        <div className="flex flex-col gap-3">
          {ev.sessions.map((s, i) => (
            <div key={s.id} className="flex items-start gap-3 p-4 rounded-[16px] bg-white/[0.03] border border-white/[0.06]">
              <div className="h-8 w-8 rounded-full bg-[var(--brand-1)]/10 border border-[var(--brand-1)]/20 flex items-center justify-center text-[10px] font-black text-[var(--brand-1)] shrink-0">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-white">{s.title}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{s.speaker} · {s.time} · {s.duration}</p>
              </div>
            </div>
          ))}
          {ev.sessions.length === 0 && (
            <div className="text-center py-8 text-white/30 text-xs font-bold">No sessions added yet</div>
          )}
        </div>
      )}

      {/* ── Tickets ──────────────────────────────────────────────────────────── */}
      {tab === "Tickets" && (
        <div className="flex flex-col gap-3">
          {ev.tickets.map((t) => (
            <div key={t.id} className="p-4 rounded-[16px] bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-white">{t.name}</span>
                <button
                  onClick={() => toggleTicketPause(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-all ${t.paused ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"}`}
                >
                  {t.paused ? <ToggleLeft className="h-3 w-3" /> : <ToggleRight className="h-3 w-3" />}
                  {t.paused ? "Paused" : "Active"}
                </button>
              </div>
              <div className="flex gap-4 text-[10px] text-white/50 mb-3">
                <span>₹{t.price}</span>
                <span>{t.sold} / {t.inventory} sold</span>
                <span className="text-[var(--brand-3)]">₹{(t.sold * t.price).toLocaleString("en-IN")} revenue</span>
              </div>
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${(t.sold / Math.max(t.inventory, 1)) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Communication ────────────────────────────────────────────────────── */}
      {tab === "Communication" && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-[16px] bg-white/[0.03] border border-white/[0.06]">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-3">Send Announcement</h3>
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              rows={3}
              placeholder="Write your message to all attendees..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--brand-1)] placeholder-white/20 transition-all resize-none mb-3"
            />
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[9px] font-black uppercase tracking-wider text-white/40">Send via</span>
              <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 gap-0.5">
                {(["email", "push", "both"] as const).map((ch) => (
                  <button key={ch} onClick={() => setChannel(ch)}
                    className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all ${channel === ch ? "bg-white/10 text-white" : "text-white/30 hover:text-white/60"}`}>
                    {ch === "both" ? "Email + Push" : ch}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={sendAnnouncement}
              className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${msgSent ? "bg-green-500/20 text-green-400 border border-green-500/20" : "bg-brand-gradient text-white shadow-glow hover:scale-[1.02]"}`}
            >
              {msgSent ? <><Check className="h-4 w-4" /> Sent!</> : <><Send className="h-4 w-4" /> Send to All Attendees</>}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-[10px] font-black uppercase tracking-wider text-white/50">Sent Announcements</h3>
            {ev.announcements.map((a) => (
              <div key={a.id} className="p-3.5 rounded-[14px] bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-white/80">{a.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[9px] text-white/30">{a.timestamp}</span>
                  <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10">{a.channel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Settings ─────────────────────────────────────────────────────────── */}
      {tab === "Settings" && (
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-[16px] bg-white/[0.03] border border-white/[0.06] flex flex-col gap-4">
            {[
              { label: "Public Event", desc: "Visible in discover and search", key: "isPublic" },
              { label: "Registration Open", desc: "Allow new attendee sign-ups", key: "registrationOpen" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-white">{item.label}</p>
                  <p className="text-[10px] text-white/40">{item.desc}</p>
                </div>
                <button onClick={() => onUpdate({ [item.key]: !(ev as any)[item.key] })} className="cursor-pointer">
                  {(ev as any)[item.key]
                    ? <ToggleRight className="h-7 w-7 text-[var(--brand-1)]" />
                    : <ToggleLeft className="h-7 w-7 text-white/30" />}
                </button>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-[16px] bg-red-500/5 border border-red-500/10">
            <p className="text-xs font-black text-white mb-1">Danger Zone</p>
            <p className="text-[10px] text-white/40 mb-3">Cancel this event and notify all attendees.</p>
            <button className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-black border border-red-500/20 hover:bg-red-500/20 cursor-pointer transition-all">
              Cancel Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
