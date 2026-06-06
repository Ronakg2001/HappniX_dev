"use client";

import React, { useState } from "react";
import { Plus, X, Zap, ToggleLeft, ToggleRight } from "lucide-react";
import { CreatedEventType } from "@/components/layout/AppLayout";

export function DraftWorkspace({
  ev,
  onUpdate,
}: {
  ev: CreatedEventType;
  onUpdate: (p: Partial<CreatedEventType>) => void;
}) {
  const [form, setForm] = useState({
    title: ev.title,
    description: ev.description,
    date: ev.date,
    time: ev.time,
    venue: ev.venue,
    address: ev.address,
    capacity: String(ev.capacity),
    price: ev.price,
    category: ev.category,
    isPublic: ev.isPublic,
  });
  const [saved, setSaved] = useState(false);
  const [newSpeaker, setNewSpeaker] = useState("");
  const [speakers, setSpeakers] = useState(ev.speakers);

  const handleSave = () => {
    onUpdate({ ...form, capacity: parseInt(form.capacity) || 100, speakers });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePublish = () => {
    onUpdate({
      ...form,
      capacity: parseInt(form.capacity) || 100,
      speakers,
      status: "Upcoming",
      registrationOpen: true,
      isPublic: true,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Event Details */}
      <div className="p-5 rounded-[20px] bg-white/[0.03] border border-white/[0.06]">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-4">Event Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-[9px] font-black uppercase tracking-wider text-white/40 block mb-1.5">Event Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--brand-1)] placeholder-white/20 transition-all"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[9px] font-black uppercase tracking-wider text-white/40 block mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--brand-1)] placeholder-white/20 transition-all resize-none"
            />
          </div>
          {[
            { label: "Date", key: "date", placeholder: "Jun 28" },
            { label: "Time", key: "time", placeholder: "9:00 PM" },
            { label: "Venue", key: "venue", placeholder: "Club Name" },
            { label: "Category", key: "category", placeholder: "Party" },
            { label: "Capacity", key: "capacity", placeholder: "200" },
            { label: "Price", key: "price", placeholder: "₹499 or Free Entry" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-[9px] font-black uppercase tracking-wider text-white/40 block mb-1.5">{label}</label>
              <input
                value={(form as any)[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--brand-1)] placeholder-white/20 transition-all"
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="text-[9px] font-black uppercase tracking-wider text-white/40 block mb-1.5">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Full address"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--brand-1)] placeholder-white/20 transition-all"
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button onClick={() => setForm((f) => ({ ...f, isPublic: !f.isPublic }))} className="cursor-pointer">
              {form.isPublic ? (
                <ToggleRight className="h-6 w-6 text-[var(--brand-1)]" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-white/30" />
              )}
            </button>
            <span className="text-xs text-white/60 font-bold">{form.isPublic ? "Public Event" : "Private Event"}</span>
          </div>
        </div>
      </div>

      {/* Speakers */}
      <div className="p-5 rounded-[20px] bg-white/[0.03] border border-white/[0.06]">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-4">Speakers / Artists</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {speakers.map((sp, i) => (
            <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-white font-bold">
              {sp}
              <button
                onClick={() => setSpeakers((s) => s.filter((_, idx) => idx !== i))}
                className="cursor-pointer text-white/30 hover:text-red-400 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newSpeaker}
            onChange={(e) => setNewSpeaker(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newSpeaker.trim()) {
                setSpeakers((s) => [...s, newSpeaker.trim()]);
                setNewSpeaker("");
              }
            }}
            placeholder="Add speaker name, press Enter"
            className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--brand-2)] placeholder-white/20 transition-all"
          />
          <button
            onClick={() => {
              if (newSpeaker.trim()) {
                setSpeakers((s) => [...s, newSpeaker.trim()]);
                setNewSpeaker("");
              }
            }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-black cursor-pointer transition-all"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer border ${
            saved
              ? "bg-green-500/20 border-green-500/30 text-green-400"
              : "bg-white/5 border-white/10 text-white hover:bg-white/10"
          }`}
        >
          {saved ? "✓ Saved!" : "Save Draft"}
        </button>
        <button
          onClick={handlePublish}
          className="flex-1 py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-black uppercase tracking-wider shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Zap className="h-4 w-4" /> Publish Event
        </button>
      </div>
    </div>
  );
}
