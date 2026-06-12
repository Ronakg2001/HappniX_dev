"use client";
import React from "react";
import { Plus, X } from "lucide-react";
import { TicketTierType } from "@/types/event";

const ENTRY_TYPES: TicketTierType["entryType"][] = ["Regular", "VIP", "Early Bird", "Custom"];

interface TicketTierBuilderProps {
  value: TicketTierType[];
  onChange: (tiers: TicketTierType[]) => void;
  error?: string;
}

export function TicketTierBuilder({ value, onChange, error }: TicketTierBuilderProps) {
  const add = () => {
    const newTier: TicketTierType = {
      id: `tier_${Date.now()}`,
      name: "",
      price: 0,
      inventory: 100,
      sold: 0,
      paused: false,
      entryType: "Regular",
      flexibleSeats: false,
      promoText: "",
    };
    onChange([...value, newTier]);
  };

  const remove = (id: string) => onChange(value.filter((t) => t.id !== id));

  const update = <K extends keyof TicketTierType>(id: string, field: K, val: TicketTierType[K]) => {
    onChange(value.map((t) => (t.id === id ? { ...t, [field]: val } : t)));
  };

  return (
    <div className="flex flex-col gap-3">
      {value.map((tier, idx) => (
        <div
          key={tier.id}
          className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3"
        >
          {/* Header row */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/30 shrink-0">TIER {idx + 1}</span>

            {/* Entry type */}
            <select
              value={tier.entryType}
              onChange={(e) => {
                const et = e.target.value as TicketTierType["entryType"];
                update(tier.id, "entryType", et);
                if (!tier.name || ENTRY_TYPES.includes(tier.name as TicketTierType["entryType"])) {
                  update(tier.id, "name", et);
                }
              }}
              className="bg-[var(--brand-1)]/10 border border-[var(--brand-1)]/20 rounded-lg px-2.5 py-1 text-[11px] font-bold text-[var(--brand-1)] outline-none"
            >
              {ENTRY_TYPES.map((t) => (
                <option key={t} value={t} className="bg-[#12121a] text-white">{t}</option>
              ))}
            </select>

            {/* Custom name (if Custom type) */}
            {tier.entryType === "Custom" && (
              <input
                type="text"
                value={tier.name}
                onChange={(e) => update(tier.id, "name", e.target.value)}
                placeholder="Tier name"
                className="flex-1 bg-transparent text-[11px] text-white placeholder-white/20 outline-none border-b border-white/10 pb-0.5"
              />
            )}

            <button
              type="button"
              onClick={() => remove(tier.id)}
              className="ml-auto p-1 text-white/20 hover:text-red-400 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Price + Seats row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-1">Price (₹)</label>
              <input
                type="number"
                min={0}
                value={tier.price}
                onChange={(e) => update(tier.id, "price", Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-[var(--brand-1)] transition-all"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-1">Seats Available</label>
              <input
                type="number"
                min={1}
                value={tier.inventory}
                onChange={(e) => update(tier.id, "inventory", Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-[var(--brand-1)] transition-all"
              />
            </div>
          </div>

          {/* Promo text */}
          <div>
            <label className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-1">Promo Text</label>
            <input
              type="text"
              value={tier.promoText}
              onChange={(e) => update(tier.id, "promoText", e.target.value)}
              placeholder="e.g. Earlybird deal — only 20 left!"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/20 outline-none focus:border-[var(--brand-1)] transition-all"
            />
          </div>

          {/* Flexible seats toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => update(tier.id, "flexibleSeats", !tier.flexibleSeats)}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                tier.flexibleSeats ? "bg-[var(--brand-1)]" : "bg-white/10"
              }`}
            >
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                tier.flexibleSeats ? "translate-x-4" : "translate-x-0.5"
              }`} />
            </div>
            <span className="text-[11px] text-white/50">Allow flexible seat count (overbooking)</span>
          </label>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-[11px] text-[var(--brand-1)] hover:opacity-80 transition-opacity self-start"
      >
        <Plus className="h-3.5 w-3.5" /> Add Ticket Tier
      </button>

      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
