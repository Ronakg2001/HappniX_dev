"use client";
import React from "react";
import { ImageIcon, MapPin } from "lucide-react";
import { CreatedEventType } from "@/types/event";
import { ImageSlotGrid } from "./ImageSlotGrid";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES = ["Party", "Gig", "Clubbing", "Social", "Concert", "Festival", "Sports", "Workshop", "Conference", "Other"];
const AGE_GROUPS = ["All Ages", "3+", "13+", "18+", "21+"];

export interface Step1Errors {
  title?: string;
  banner?: string;
  highlights?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  address?: string;
  description?: string;
}

interface Step1Props {
  data: Partial<CreatedEventType>;
  onChange: (patch: Partial<CreatedEventType>) => void;
  errors: Step1Errors;
}

export function Step1BasicDetails({ data, onChange, errors }: Step1Props) {
  const schedule = data.schedule || { startDate: "", endDate: "", startTime: "", endTime: "" };
  const location = data.location || { venue: "", address: "", lat: null, lng: null };

  return (
    <div className="space-y-6">
      {/* Event Title */}
      <Field 
        label="Event Name *" 
        error={errors.title} 
        hint={`Length: ${(data.title ?? "").length}/50`}
      >
        <Input
          type="text"
          maxLength={50}
          value={data.title ?? ""}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Secret Rooftop Techno Set"
          className={errors.title ? "border-red-500/60 focus:border-red-500" : ""}
        />
      </Field>

      {/* Category */}
      <Field label="Category">
        <Select
          value={data.category ?? "Party"}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-[#09090b] text-white">{c}</option>
          ))}
        </Select>
      </Field>

      {/* Banner URL */}
      <Field label="Cover / Banner Image *" error={errors.banner}>
        <div className="flex gap-2">
          <Input
            type="url"
            value={data.bannerUrl ?? ""}
            onChange={(e) => onChange({ bannerUrl: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            className={errors.banner ? "border-red-500/60 focus:border-red-500" : ""}
          />
        </div>
        {data.bannerUrl && (
          <div className="mt-2 aspect-[16/6] rounded-xl overflow-hidden border border-white/10">
            <img src={data.bannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
          </div>
        )}
        {!data.bannerUrl && (
          <div className="mt-2 aspect-[16/6] rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center text-white/20">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </Field>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start Date *" error={errors.startDate}>
          <Input
            type="date"
            value={schedule.startDate ?? ""}
            onChange={(e) =>
              onChange({
                schedule: {
                  ...schedule,
                  startDate: e.target.value,
                  endDate: schedule.endDate || e.target.value,
                },
              })
            }
            className={errors.startDate ? "border-red-500/60 focus:border-red-500" : ""}
          />
        </Field>
        <Field label="End Date">
          <Input
            type="date"
            value={schedule.endDate ?? ""}
            onChange={(e) =>
              onChange({
                schedule: {
                  ...schedule,
                  endDate: e.target.value,
                },
              })
            }
            min={schedule.startDate}
          />
        </Field>
      </div>

      {/* Times */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start Time *" error={errors.startTime}>
          <Input
            type="time"
            value={schedule.startTime ?? ""}
            onChange={(e) =>
              onChange({
                schedule: {
                  ...schedule,
                  startTime: e.target.value,
                },
              })
            }
            className={errors.startTime ? "border-red-500/60 focus:border-red-500" : ""}
          />
        </Field>
        <Field label="End Time">
          <Input
            type="time"
            value={schedule.endTime ?? ""}
            onChange={(e) =>
              onChange({
                schedule: {
                  ...schedule,
                  endTime: e.target.value,
                },
              })
            }
          />
        </Field>
      </div>

      {/* Location */}
      <Field label="Venue Name *">
        <Input
          type="text"
          value={location.venue ?? ""}
          onChange={(e) =>
            onChange({
              location: {
                ...location,
                venue: e.target.value,
              },
            })
          }
          placeholder="e.g. Utopia Club, C-Scheme"
        />
      </Field>
      
      <Field label="Full Address *" error={errors.address}>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 z-10" />
          <Input
            type="text"
            value={location.address ?? ""}
            onChange={(e) =>
              onChange({
                location: {
                  ...location,
                  address: e.target.value,
                },
              })
            }
            placeholder="Plot 23, C-Scheme, Jaipur, Rajasthan 302001"
            className={`pl-10 ${errors.address ? "border-red-500/60 focus:border-red-500" : ""}`}
          />
        </div>
      </Field>

      {/* Highlights */}
      <div>
        <ImageSlotGrid
          label="Highlight Images"
          images={data.highlights ?? []}
          onChange={(imgs) => onChange({ highlights: imgs })}
          max={9}
          error={errors.highlights}
        />
      </div>

      {/* Highlight Text */}
      <Field label="Highlights / What to Expect">
        <Textarea
          value={data.highlightText ?? ""}
          onChange={(e) => onChange({ highlightText: e.target.value })}
          placeholder="Describe what makes this event special — artists, experience, vibe..."
          rows={3}
        />
      </Field>

      {/* Description / Bio */}
      <Field label="Event Description *" error={errors.description}>
        <Textarea
          value={data.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Give your audience the full picture — what this event is, the experience, what to bring..."
          rows={5}
          className={errors.description ? "border-red-500/60 focus:border-red-500" : ""}
        />
      </Field>

      {/* Age Group */}
      <div>
        <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Age Restriction</label>
        <div className="flex flex-wrap gap-2">
          {AGE_GROUPS.map((ag) => (
            <button
              key={ag}
              type="button"
              onClick={() => onChange({ ageGroup: ag })}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                (data.ageGroup ?? "18+") === ag
                  ? "bg-[var(--brand-1)] text-white shadow-glow"
                  : "bg-white/5 text-white/50 border border-white/10 hover:border-white/30"
              }`}
            >
              {ag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function validateStep1(data: Partial<CreatedEventType>): Step1Errors {
  const errors: Step1Errors = {};
  if (!data.title?.trim()) errors.title = "Event name is required";
  else if (data.title.length > 50) errors.title = "Must be 50 characters or less";
  if (!data.bannerUrl?.trim()) errors.banner = "Cover image URL is required";

  const schedule = data.schedule || { startDate: "", endDate: "", startTime: "", endTime: "" };
  const location = data.location || { venue: "", address: "", lat: null, lng: null };

  if (!schedule.startDate) errors.startDate = "Start date is required";
  else if (new Date(schedule.startDate) < new Date(new Date().toISOString().split("T")[0])) {
    errors.startDate = "Date cannot be in the past";
  }
  if (schedule.endDate && schedule.startDate && schedule.endDate < schedule.startDate) {
    errors.endDate = "End date must be on or after start date";
  }
  if (!schedule.startTime) errors.startTime = "Start time is required";
  if (!location.address?.trim()) errors.address = "Full address is required";
  if (!data.description?.trim()) errors.description = "Event description is required";
  if (!data.highlights?.some(Boolean)) errors.highlights = "At least one highlight image is required";
  return errors;
}
