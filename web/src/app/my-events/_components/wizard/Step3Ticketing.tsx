"use client";
import React from "react";
import { Users, Zap, Lock } from "lucide-react";
import { CreatedEventType } from "@/types/event";
import { TicketTierBuilder } from "./TicketTierBuilder";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const TICKET_MODES: { mode: CreatedEventType["ticketing"]["mode"]; label: string; desc: string; icon: React.ReactNode; disabled?: boolean }[] = [
  { mode: "free", label: "Free Event", desc: "Anyone can register for free", icon: <Zap className="h-4 w-4" /> },
  { mode: "paid", label: "Paid Tickets", desc: "Sell tickets with custom pricing", icon: <Users className="h-4 w-4" /> },
  { mode: "guestlist", label: "Guestlist", desc: "Invite-only access", icon: <Lock className="h-4 w-4" />, disabled: true },
];

export interface Step3Errors {
  capacity?: string;
  tiers?: string;
}

interface Step3Props {
  data: Partial<CreatedEventType>;
  onChange: (patch: Partial<CreatedEventType>) => void;
  errors: Step3Errors;
}

export function Step3Ticketing({ data, onChange, errors }: Step3Props) {
  const ticketing = data.ticketing || { mode: "free", capacity: 100, capacityFlex: false, tiers: [], promoCodes: [], price: "" };
  const ticketMode = ticketing.mode ?? "free";
  const hasCapacityLimit = (ticketing.capacity ?? 0) > 0;

  return (
    <div className="space-y-7">
      {/* Capacity */}
      <Field label="Capacity / Seats" error={errors.capacity}>
        <div className="flex items-center gap-3 mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() =>
                onChange({
                  ticketing: {
                    ...ticketing,
                    capacity: hasCapacityLimit ? 0 : 100,
                  },
                })
              }
              className={`relative h-5 w-9 rounded-full transition-colors ${
                hasCapacityLimit ? "bg-[var(--brand-1)]" : "bg-white/10"
              }`}
            >
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                hasCapacityLimit ? "translate-x-4" : "translate-x-0.5"
              }`} />
            </div>
            <span className="text-[11px] text-white/50">
              {hasCapacityLimit ? "Limited capacity" : "No capacity limit"}
            </span>
          </label>
        </div>

        {hasCapacityLimit && (
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={1}
              value={ticketing.capacity ?? 100}
              onChange={(e) =>
                onChange({
                  ticketing: {
                    ...ticketing,
                    capacity: Number(e.target.value),
                  },
                })
              }
              className={`w-32 ${errors.capacity ? "border-red-500/60 focus:border-red-500" : ""}`}
            />
            <span className="text-xs text-white/40">max attendees</span>
          </div>
        )}

        {/* Flexible overbooking */}
        {hasCapacityLimit && (
          <label className="flex items-center gap-2 cursor-pointer mt-3">
            <div
              onClick={() =>
                onChange({
                  ticketing: {
                    ...ticketing,
                    capacityFlex: !ticketing.capacityFlex,
                  },
                })
              }
              className={`relative h-5 w-9 rounded-full transition-colors ${
                ticketing.capacityFlex ? "bg-amber-500" : "bg-white/10"
              }`}
            >
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                ticketing.capacityFlex ? "translate-x-4" : "translate-x-0.5"
              }`} />
            </div>
            <span className="text-[11px] text-white/40">Allow overbooking (flexible capacity)</span>
          </label>
        )}
      </Field>

      {/* Ticket Mode */}
      <div>
        <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Ticket Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {TICKET_MODES.map(({ mode, label, desc, icon, disabled }) => {
            const active = ticketMode === mode;
            return (
              <button
                key={mode}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    ticketing: {
                      ...ticketing,
                      mode,
                    },
                  })
                }
                className={`relative flex flex-col items-start gap-2 p-3 rounded-2xl border transition-all text-left ${
                  disabled
                    ? "opacity-40 cursor-not-allowed border-white/5 bg-white/3"
                    : active
                    ? "border-[var(--brand-1)]/60 bg-[var(--brand-1)]/10 shadow-glow"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                {disabled && (
                  <span className="absolute top-1.5 right-1.5 text-[8px] font-black text-white/20 uppercase tracking-wider">Soon</span>
                )}
                <div className={`${active ? "text-[var(--brand-1)]" : "text-white/40"} transition-colors`}>
                  {icon}
                </div>
                <div>
                  <p className={`text-[11px] font-black ${active ? "text-white" : "text-white/50"}`}>{label}</p>
                  <p className="text-[9px] text-white/30 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ticket Tiers (paid mode only) */}
      {ticketMode === "paid" && (
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Ticket Tiers</label>
          <TicketTierBuilder
            value={ticketing.tiers ?? []}
            onChange={(tiers) =>
              onChange({
                ticketing: {
                  ...ticketing,
                  tiers,
                },
              })
            }
            error={errors.tiers}
          />
        </div>
      )}

      {/* Free mode info */}
      {ticketMode === "free" && (
        <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4">
          <p className="text-[11px] text-green-400/80 leading-relaxed">
            <span className="font-black text-green-400">Free Event</span> — Attendees can register at no cost. You can still set a capacity limit to control attendance.
          </p>
        </div>
      )}
    </div>
  );
}

export function validateStep3(data: Partial<CreatedEventType>): Step3Errors {
  const errors: Step3Errors = {};
  const ticketing = data.ticketing || { mode: "free", capacity: 100, capacityFlex: false, tiers: [], promoCodes: [], price: "" };
  if ((ticketing.capacity ?? 0) < 0) errors.capacity = "Capacity must be a positive number";
  if (ticketing.mode === "paid") {
    const tiers = ticketing.tiers ?? [];
    if (tiers.length === 0) {
      errors.tiers = "Add at least one ticket tier for paid events";
    } else {
      const bad = tiers.find((t) => t.price <= 0 || t.inventory <= 0);
      if (bad) errors.tiers = "All tiers must have a price > 0 and available seats > 0";
    }
  }
  return errors;
}
