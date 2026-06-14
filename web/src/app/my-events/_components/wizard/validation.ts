import { CreatedEventType } from "@/types/event";

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

export interface Step2Errors {
  tags?: string;
  faqs?: string;
  promoCodes?: string;
}

export interface Step3Errors {
  capacity?: string;
  tiers?: string;
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

export function validateStep2(data: Partial<CreatedEventType>): Step2Errors {
  const errors: Step2Errors = {};
  if ((data.tags ?? []).length < 2) errors.tags = "At least 2 event tags are required";
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
