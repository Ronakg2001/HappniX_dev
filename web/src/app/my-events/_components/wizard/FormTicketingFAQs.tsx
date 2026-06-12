"use client";
import React from "react";
import { CreatedEventType } from "@/types/event";
import { Step2Errors } from "./Step2EventDetails";
import { Step3Errors } from "./Step3Ticketing";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TicketTierBuilder } from "./TicketTierBuilder";
import { PromoCodeBuilder } from "./PromoCodeBuilder";
import { FAQBuilder } from "./FAQBuilder";

interface FormTicketingFAQsProps {
  data: Partial<CreatedEventType>;
  onChange: (patch: Partial<CreatedEventType>) => void;
  errors: Step3Errors & Step2Errors;
}

export function FormTicketingFAQs({ data, onChange, errors }: FormTicketingFAQsProps) {
  const ticketing = data.ticketing || { mode: "free", capacity: 100, capacityFlex: false, tiers: [], promoCodes: [], price: "" };
  const policies = data.policies || { termsAndConditions: "", privacyPolicy: "", faqs: [] };
  const hasCapacityLimit = (ticketing.capacity ?? 0) > 0;

  const patchTicketing = (patch: Partial<typeof ticketing>) => {
    onChange({
      ticketing: {
        ...ticketing,
        ...patch,
      },
    });
  };

  const patchPolicies = (patch: Partial<typeof policies>) => {
    onChange({
      policies: {
        ...policies,
        ...patch,
      },
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Capacity */}
      <Field label="Capacity / Seats" error={errors.capacity}>
        <div className="flex items-center gap-3 mb-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() =>
                patchTicketing({
                  capacity: hasCapacityLimit ? 0 : 100,
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
              onChange={(e) => patchTicketing({ capacity: Number(e.target.value) })}
              className="w-32"
            />
            <span className="text-xs text-white/40">max attendees</span>
          </div>
        )}

        {hasCapacityLimit && (
          <label className="flex items-center gap-2 cursor-pointer mt-3">
            <div
              onClick={() => patchTicketing({ capacityFlex: !ticketing.capacityFlex })}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { mode: "free" as const, label: "Free Event", desc: "Attendees register at no cost", disabled: false },
            { mode: "paid" as const, label: "Paid Tickets", desc: "Sell tickets with custom pricing", disabled: false },
            { mode: "guestlist" as const, label: "Guestlist", desc: "Invite-only access (Upcoming)", disabled: true }
          ].map(({ mode, label, desc, disabled }) => {
            const active = ticketing.mode === mode;
            return (
              <button
                key={mode}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && patchTicketing({ mode })}
                className={`flex flex-col items-start gap-1.5 p-3.5 rounded-[14px] border transition-all text-left relative ${
                  disabled
                    ? "opacity-40 cursor-not-allowed border-white/5 bg-white/3"
                    : active
                    ? "border-[var(--brand-1)]/60 bg-[var(--brand-1)]/10 shadow-glow cursor-pointer"
                    : "border-white/10 bg-white/5 hover:border-white/20 cursor-pointer"
                }`}
              >
                {disabled && (
                  <span className="absolute top-2.5 right-2.5 text-[7px] font-black text-[var(--brand-1)] bg-[var(--brand-1)]/10 border border-[var(--brand-1)]/20 px-1 py-0.5 rounded uppercase tracking-wider">Soon</span>
                )}
                <p className={`text-[11px] font-black ${active ? "text-white" : "text-white/50"}`}>{label}</p>
                <p className="text-[9px] text-white/30 leading-tight">{desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {ticketing.mode === "paid" && (
        <div>
          <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Ticket Tiers</label>
          <TicketTierBuilder
            value={ticketing.tiers ?? []}
            onChange={(tiers) => patchTicketing({ tiers })}
            error={errors.tiers}
          />
        </div>
      )}

      {ticketing.mode === "paid" && (
        <Field label="Promo Codes">
          <PromoCodeBuilder
            value={ticketing.promoCodes ?? []}
            onChange={(codes) => patchTicketing({ promoCodes: codes })}
          />
        </Field>
      )}

      {/* FAQ Builder */}
      <Field label="Frequently Asked Questions" error={errors.faqs}>
        <FAQBuilder
          value={policies.faqs ?? []}
          onChange={(faqs) => patchPolicies({ faqs })}
          error={errors.faqs}
        />
      </Field>

      {/* Policies */}
      <Field label="Terms & Conditions">
        <Textarea
          value={policies.termsAndConditions ?? ""}
          onChange={(e) => patchPolicies({ termsAndConditions: e.target.value })}
          placeholder="e.g. Entry is non-refundable. ID check mandatory at gates."
          rows={3}
        />
      </Field>

      <Field label="Privacy Policy">
        <Textarea
          value={policies.privacyPolicy ?? ""}
          onChange={(e) => patchPolicies({ privacyPolicy: e.target.value })}
          placeholder="e.g. Personal data is only processed for ticket booking check-in."
          rows={3}
        />
      </Field>
    </div>
  );
}
