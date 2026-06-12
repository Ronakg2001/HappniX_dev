"use client";
import React from "react";
import { CreatedEventType } from "@/types/event";
import { TagInput } from "./TagInput";
import { FAQBuilder } from "./FAQBuilder";
import { PromoCodeBuilder } from "./PromoCodeBuilder";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const SERVICES = ["Food", "Alcohol", "Valet Parking", "Security", "First Aid", "Photography", "Merchandise"];

export interface Step2Errors {
  tags?: string;
  faqs?: string;
  promoCodes?: string;
}

interface Step2Props {
  data: Partial<CreatedEventType>;
  onChange: (patch: Partial<CreatedEventType>) => void;
  errors: Step2Errors;
}

export function Step2EventDetails({ data, onChange, errors }: Step2Props) {
  const services = data.services ?? [];
  const dresscode = data.dresscode || { enabled: false, style: "" };
  const ticketing = data.ticketing || { mode: "free", capacity: 100, capacityFlex: false, tiers: [], promoCodes: [], price: "" };
  const policies = data.policies || { termsAndConditions: "", privacyPolicy: "", faqs: [] };

  const toggleService = (s: string) => {
    onChange({ services: services.includes(s) ? services.filter((x) => x !== s) : [...services, s] });
  };

  return (
    <div className="space-y-7">
      {/* Services Provided */}
      <div>
        <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Services Provided</label>
        <div className="flex flex-wrap gap-2">
          {SERVICES.map((s) => {
            const active = services.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleService(s)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                  active
                    ? "bg-[var(--brand-2)]/20 border border-[var(--brand-2)]/50 text-[var(--brand-2)]"
                    : "bg-white/5 border border-white/10 text-white/50 hover:border-white/30 hover:text-white/70"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dress Code */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <label className="text-xs font-bold text-white/50 uppercase tracking-wider">Dress Code</label>
          <label className="flex items-center gap-2 cursor-pointer">
            <div
              onClick={() => onChange({ dresscode: { ...dresscode, enabled: !dresscode.enabled } })}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                dresscode.enabled ? "bg-[var(--brand-1)]" : "bg-white/10"
              }`}
            >
              <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                dresscode.enabled ? "translate-x-4" : "translate-x-0.5"
              }`} />
            </div>
            <span className="text-[11px] text-white/40">{dresscode.enabled ? "Required" : "Optional / None"}</span>
          </label>
        </div>
        {dresscode.enabled && (
          <Input
            type="text"
            value={dresscode.style ?? ""}
            onChange={(e) => onChange({ dresscode: { ...dresscode, style: e.target.value } })}
            placeholder="e.g. All Black, Smart Casual, Neon / UV Reactive"
          />
        )}
      </div>

      {/* Event Tags */}
      <TagInput
        label="Event Tags"
        hint="Min 2 tags required to publish. Max 10, no duplicates."
        value={data.tags ?? []}
        onChange={(tags) => onChange({ tags })}
        max={10}
        placeholder="e.g. techno, club, dj..."
        error={errors.tags}
      />

      {/* Artists / Performers */}
      <TagInput
        label="Artists / Performers"
        hint="Add artist or performer names. Enter to add."
        value={data.artists ?? []}
        onChange={(artists) => onChange({ artists })}
        max={20}
        placeholder="e.g. DJ Ayasha, LVRS..."
      />

      {/* Promo Codes */}
      <Field label="Promo Codes" error={errors.promoCodes}>
        <PromoCodeBuilder
          value={ticketing.promoCodes ?? []}
          onChange={(codes) => onChange({ ticketing: { ...ticketing, promoCodes: codes } })}
          error={errors.promoCodes}
        />
      </Field>

      {/* FAQs */}
      <Field label="FAQs" error={errors.faqs}>
        <FAQBuilder
          value={policies.faqs ?? []}
          onChange={(faqs) => onChange({ policies: { ...policies, faqs } })}
          error={errors.faqs}
        />
      </Field>

      {/* Terms & Conditions */}
      <Field label="Terms & Conditions">
        <Textarea
          value={policies.termsAndConditions ?? ""}
          onChange={(e) => onChange({ policies: { ...policies, termsAndConditions: e.target.value } })}
          placeholder="Entry is non-refundable. Management reserves the right to deny entry. By purchasing a ticket you agree to our terms."
          rows={4}
        />
      </Field>

      {/* Privacy Policy */}
      <Field label="Privacy Policy">
        <Textarea
          value={policies.privacyPolicy ?? ""}
          onChange={(e) => onChange({ policies: { ...policies, privacyPolicy: e.target.value } })}
          placeholder="Your personal data will be used solely for event management and will not be shared with third parties."
          rows={3}
        />
      </Field>
    </div>
  );
}

export function validateStep2(data: Partial<CreatedEventType>): Step2Errors {
  const errors: Step2Errors = {};
  const policies = data.policies || { termsAndConditions: "", privacyPolicy: "", faqs: [] };
  const ticketing = data.ticketing || { mode: "free", capacity: 100, capacityFlex: false, tiers: [], promoCodes: [], price: "" };
  const faqs = policies.faqs ?? [];
  const incomplete = faqs.filter((f) => !f.question.trim() || !f.answer.trim());
  if (incomplete.length > 0) errors.faqs = "All FAQ entries must have both a question and an answer";
  const promoCodes = ticketing.promoCodes ?? [];
  const badCodes = promoCodes.filter((p) => !p.code.trim() || p.discount < 1 || p.discount > 100);
  if (badCodes.length > 0) errors.promoCodes = "All promo codes must have a code and a discount between 1–100%";
  return errors;
}
