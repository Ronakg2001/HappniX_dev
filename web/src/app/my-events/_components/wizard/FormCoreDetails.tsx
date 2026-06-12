"use client";
import React from "react";
import { MapPin } from "lucide-react";
import { CreatedEventType } from "@/types/event";
import { Step1Errors } from "./Step1BasicDetails";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

interface FormCoreDetailsProps {
  data: Partial<CreatedEventType>;
  onChange: (patch: Partial<CreatedEventType>) => void;
  errors: Step1Errors;
}

const CATEGORIES = ["Party", "Gig", "Clubbing", "Social", "Concert", "Festival", "Sports", "Workshop", "Conference", "Other"];
const AGE_GROUPS = ["All Ages", "3+", "13+", "18+", "21+"];

export function FormCoreDetails({ data, onChange, errors }: FormCoreDetailsProps) {
  const schedule = data.schedule || { startDate: "", endDate: "", startTime: "20:00", endTime: "23:00" };
  const location = data.location || { venue: "Venue TBD", address: "", lat: null, lng: null };

  const patchSchedule = (patch: Partial<typeof schedule>) => {
    onChange({
      schedule: {
        ...schedule,
        ...patch,
      },
    });
  };

  const patchLocation = (patch: Partial<typeof location>) => {
    onChange({
      location: {
        ...location,
        ...patch,
      },
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <Field label="Event Name *" error={errors.title}>
        <Input
          type="text"
          maxLength={50}
          value={data.title ?? ""}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Secret Rooftop Techno Set"
        />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <Field label="Age Restriction">
          <div className="flex flex-wrap gap-1.5 h-10 items-center">
            {AGE_GROUPS.map((ag) => (
              <button
                key={ag}
                type="button"
                onClick={() => onChange({ ageGroup: ag })}
                className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                  (data.ageGroup ?? "18+") === ag
                    ? "bg-[var(--brand-1)] text-white shadow-glow"
                    : "bg-white/5 text-white/50 border border-white/10 hover:border-white/20"
                }`}
              >
                {ag}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start Date *" error={errors.startDate}>
          <Input
            type="date"
            style={{ colorScheme: "dark" }}
            value={schedule.startDate ?? ""}
            onChange={(e) => patchSchedule({ startDate: e.target.value, endDate: schedule.endDate || e.target.value })}
          />
        </Field>
        <Field label="End Date" error={errors.endDate}>
          <Input
            type="date"
            style={{ colorScheme: "dark" }}
            value={schedule.endDate ?? ""}
            onChange={(e) => patchSchedule({ endDate: e.target.value })}
            min={schedule.startDate}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start Time *" error={errors.startTime}>
          <Input
            type="time"
            style={{ colorScheme: "dark" }}
            value={schedule.startTime ?? ""}
            onChange={(e) => patchSchedule({ startTime: e.target.value })}
          />
        </Field>
        <Field label="End Time">
          <Input
            type="time"
            style={{ colorScheme: "dark" }}
            value={schedule.endTime ?? ""}
            onChange={(e) => patchSchedule({ endTime: e.target.value })}
          />
        </Field>
      </div>

      <Field label="Venue Name *">
        <Input
          type="text"
          value={location.venue ?? ""}
          onChange={(e) => patchLocation({ venue: e.target.value })}
          placeholder="e.g. Utopia Club, C-Scheme"
        />
      </Field>

      <Field label="Full Address *" error={errors.address}>
        <div className="relative mb-3">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 z-10" />
          <Input
            type="text"
            value={location.address ?? ""}
            onChange={(e) => patchLocation({ address: e.target.value })}
            placeholder="Plot 23, C-Scheme, Jaipur, Rajasthan 302001"
            className="pl-10"
          />
        </div>
        <MapPicker
          lat={location.lat}
          lng={location.lng}
          onChange={(lat, lng, address) => patchLocation({ lat, lng, address })}
        />
      </Field>

      <Field label="Event Description *" error={errors.description}>
        <Textarea
          value={data.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe what makes this experience special..."
          rows={4}
        />
      </Field>
    </div>
  );
}
