"use client";
import React from "react";
import { CreatedEventType } from "@/types/event";
import { Step1Errors } from "./validation";
import { Step2Errors } from "./validation";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/ui/tag-input";
import { ImageIcon, Plus } from "lucide-react";

interface FormPerksLineupProps {
  data: Partial<CreatedEventType>;
  onChange: (patch: Partial<CreatedEventType>) => void;
  errors: Step1Errors & Step2Errors;
}

const SERVICES = ["Food", "Alcohol", "Valet Parking", "Security", "First Aid", "Photography", "Merchandise"];

export function FormPerksLineup({ data, onChange, errors }: FormPerksLineupProps) {
  const services = data.services ?? [];
  const dresscode = data.dresscode || { enabled: false, style: "" };

  const toggleService = (s: string) => {
    onChange({ services: services.includes(s) ? services.filter((x) => x !== s) : [...services, s] });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Cover Banner */}
      <Field label="Cover Banner Image *" error={errors.banner}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="h-20 w-32 rounded-xl overflow-hidden border border-white/10 bg-white/5 relative shrink-0 flex items-center justify-center">
            {data.bannerUrl ? (
              <img src={data.bannerUrl} alt="Cover preview" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="h-6 w-6 text-white/20" />
            )}
          </div>
          <div className="flex-1 w-full space-y-2">
            <Input
              type="url"
              value={data.bannerUrl ?? ""}
              onChange={(e) => onChange({ bannerUrl: e.target.value })}
              placeholder="Paste cover image URL..."
              className="py-1.5 text-xs"
            />
            <div className="relative">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white transition-all cursor-pointer"
              >
                Upload Image File
              </button>
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        onChange({ bannerUrl: event.target.result as string });
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </Field>

      {/* Highlights */}
      <Field label="Highlight Gallery Images *" error={errors.highlights}>
        <div className="flex flex-wrap gap-2 mb-2">
          {(data.highlights ?? []).filter(Boolean).map((url, idx) => (
            <div key={idx} className="relative rounded-xl overflow-hidden border border-white/10 bg-white/5 group h-14 w-14 shrink-0">
              <img src={url} alt={`Highlight ${idx}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange({ highlights: (data.highlights ?? []).filter((_, i) => i !== idx) })}
                className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold cursor-pointer"
              >
                Remove
              </button>
            </div>
          ))}
          
          {(!data.highlights || data.highlights.filter(Boolean).length < 9) && (
            <div className="relative rounded-xl border border-dashed border-white/20 hover:border-white/40 flex items-center justify-center text-white/30 hover:text-white transition-all cursor-pointer h-14 w-14 shrink-0">
              <Plus className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      if (event.target?.result) {
                        onChange({ highlights: [...(data.highlights ?? []), event.target.result as string] });
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
          )}
        </div>
        
        <Input
          type="url"
          placeholder="Or paste highlight image URL and press Enter..."
          className="py-1.5 text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const val = (e.target as HTMLInputElement).value.trim();
              if (val) {
                onChange({ highlights: [...(data.highlights ?? []), val] });
                (e.target as HTMLInputElement).value = "";
              }
            }
          }}
        />
      </Field>

      <Field label="Highlight Title / Subtext">
        <Input
          type="text"
          value={data.highlightText ?? ""}
          onChange={(e) => onChange({ highlightText: e.target.value })}
          placeholder="e.g. Pure underground energy. Immersive visual aesthetics."
        />
      </Field>

      {/* Services */}
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
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
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
            <span className="text-[11px] text-white/40">{dresscode.enabled ? "Required" : "Optional"}</span>
          </label>
        </div>
        {dresscode.enabled && (
          <Input
            type="text"
            value={dresscode.style ?? ""}
            onChange={(e) => onChange({ dresscode: { ...dresscode, style: e.target.value } })}
            placeholder="e.g. Neon dresscode, Blacktie, Casual"
          />
        )}
      </div>

      {/* Tags */}
      <TagInput
        label="Event Tags *"
        hint="Min 2 tags required to publish. Enter to add."
        value={data.tags ?? []}
        onChange={(tags) => onChange({ tags })}
        max={10}
        placeholder="e.g. techno, clubbing, djset"
        error={errors.tags}
      />

      {/* Artists */}
      <TagInput
        label="Artists / Performers"
        hint="Add artists names. Enter to add."
        value={data.artists ?? []}
        onChange={(artists) => onChange({ artists })}
        max={20}
        placeholder="e.g. Charlotte de Witte, Amelie Lens"
      />
    </div>
  );
}
