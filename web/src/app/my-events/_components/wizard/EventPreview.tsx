"use client";
import React from "react";
import { MapPin, Calendar, Clock, Users, Shirt, Music, Sparkles, ShieldCheck, Info, Compass } from "lucide-react";
import { CreatedEventType } from "@/types/event";
import { validateStep2 } from "./Step2EventDetails";
import { validateStep3 } from "./Step3Ticketing";
import { Button } from "@/components/ui/button";

interface EventPreviewProps {
  data: Partial<CreatedEventType>;
  publishErrors: string[];
  onEditStep?: (step: number) => void;
  hideChecklist?: boolean;
}

function getStep1MissingText(data: Partial<CreatedEventType>): string[] {
  const missing: string[] = [];
  const schedule = data.schedule || { startDate: "", endDate: "", startTime: "", endTime: "" };
  const location = data.location || { venue: "", address: "", lat: null, lng: null };

  if (!data.title?.trim()) missing.push("Name");
  if (!data.bannerUrl?.trim()) missing.push("Cover Image");
  if (!schedule.startDate) missing.push("Start Date");
  if (!schedule.startTime) missing.push("Start Time");
  if (!location.address?.trim()) missing.push("Address");
  if (!data.description?.trim()) missing.push("Description");
  if (!data.highlights?.some(Boolean)) missing.push("Highlights");
  return missing;
}

function getStep2MissingText(data: Partial<CreatedEventType>): string[] {
  const missing: string[] = [];
  if ((data.tags ?? []).length < 2) missing.push("2+ Tags");
  const step2Errs = validateStep2(data);
  if (step2Errs.faqs) missing.push("FAQ format");
  if (step2Errs.promoCodes) missing.push("Promo Codes");
  return missing;
}

function getStep3MissingText(data: Partial<CreatedEventType>): string[] {
  const missing: string[] = [];
  const ticketing = data.ticketing || { mode: "free" as const, capacity: 100, capacityFlex: false, tiers: [], promoCodes: [], price: "" };
  if (ticketing.mode === "paid" && (ticketing.tiers ?? []).length === 0) {
    missing.push("Ticket Tier");
  }
  const step3Errs = validateStep3(data);
  if (step3Errs.capacity) missing.push("Capacity value");
  if (step3Errs.tiers) missing.push("Tier values");
  return missing;
}

export function EventPreview({ data, publishErrors, onEditStep, hideChecklist = false }: EventPreviewProps) {
  const schedule = data.schedule || { startDate: "", endDate: "", startTime: "", endTime: "" };
  const location = data.location || { venue: "", address: "", lat: null, lng: null };
  const ticketing = data.ticketing || { mode: "free" as const, capacity: 100, capacityFlex: false, tiers: [], promoCodes: [], price: "" };
  const policies = data.policies || { termsAndConditions: "", privacyPolicy: "", faqs: [] };
  const dresscode = data.dresscode || { enabled: false, style: "" };

  const [activeTab, setActiveTab] = React.useState<"about" | "lineup" | "faq">("about");

  const step1Missing = getStep1MissingText(data);
  const step2Missing = getStep2MissingText(data);
  const step3Missing = getStep3MissingText(data);

  const isStep1Valid = step1Missing.length === 0;
  const isStep2Valid = step2Missing.length === 0;
  const isStep3Valid = step3Missing.length === 0;

  return (
    <div className="space-y-0">
      {/* Setup Checklist */}
      {!hideChecklist && (
        <div className="mb-6 rounded-2xl liquid-glass liquid-edge border border-border p-4.5 shadow-card">
          <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--brand-1)]" />
            Setup Checklist
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1 Card */}
            <div className={`p-3 rounded-xl border transition-all flex flex-col justify-between min-h-[90px] ${
              isStep1Valid 
                ? "bg-green-500/[0.02] border-green-500/20 hover:border-green-500/30" 
                : "bg-amber-500/[0.02] border-amber-500/20 hover:border-amber-500/30"
            }`}>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[9px] font-black ${
                    isStep1Valid 
                      ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                  }`}>
                    {isStep1Valid ? "✓" : "!"}
                  </span>
                  <span className="text-xs font-bold text-white">1. Basic Details</span>
                </div>
                <p className={`text-[10px] leading-tight ${isStep1Valid ? "text-green-400/70" : "text-amber-400/70"}`}>
                  {isStep1Valid ? "Ready" : `Missing: ${step1Missing.join(", ")}`}
                </p>
              </div>
              <Button
                type="button"
                variant={isStep1Valid ? "outline" : "brand"}
                onClick={() => onEditStep?.(1)}
                className={`mt-2 w-full py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  isStep1Valid 
                    ? "bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white" 
                    : "bg-brand-gradient text-white hover:brightness-110 shadow-glow"
                }`}
              >
                {isStep1Valid ? "Edit" : "Complete"}
              </Button>
            </div>

            {/* Step 2 Card */}
            <div className={`p-3 rounded-xl border transition-all flex flex-col justify-between min-h-[90px] ${
              isStep2Valid 
                ? "bg-green-500/[0.02] border-green-500/20 hover:border-green-500/30" 
                : "bg-amber-500/[0.02] border-amber-500/20 hover:border-amber-500/30"
            }`}>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[9px] font-black ${
                    isStep2Valid 
                      ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                  }`}>
                    {isStep2Valid ? "✓" : "!"}
                  </span>
                  <span className="text-xs font-bold text-white">2. Event Details</span>
                </div>
                <p className={`text-[10px] leading-tight ${isStep2Valid ? "text-green-400/70" : "text-amber-400/70"}`}>
                  {isStep2Valid ? "Ready" : `Missing: ${step2Missing.join(", ")}`}
                </p>
              </div>
              <Button
                type="button"
                variant={isStep2Valid ? "outline" : "brand"}
                onClick={() => onEditStep?.(2)}
                className={`mt-2 w-full py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  isStep2Valid 
                    ? "bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white" 
                    : "bg-brand-gradient text-white hover:brightness-110 shadow-glow"
                }`}
              >
                {isStep2Valid ? "Edit" : "Complete"}
              </Button>
            </div>

            {/* Step 3 Card */}
            <div className={`p-3 rounded-xl border transition-all flex flex-col justify-between min-h-[90px] ${
              isStep3Valid 
                ? "bg-green-500/[0.02] border-green-500/20 hover:border-green-500/30" 
                : "bg-amber-500/[0.02] border-amber-500/20 hover:border-amber-500/30"
            }`}>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[9px] font-black ${
                    isStep3Valid 
                      ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                  }`}>
                    {isStep3Valid ? "✓" : "!"}
                  </span>
                  <span className="text-xs font-bold text-white">3. Tickets & Capacity</span>
                </div>
                <p className={`text-[10px] leading-tight ${isStep3Valid ? "text-green-400/70" : "text-amber-400/70"}`}>
                  {isStep3Valid ? "Ready" : `Missing: ${step3Missing.join(", ")}`}
                </p>
              </div>
              <Button
                type="button"
                variant={isStep3Valid ? "outline" : "brand"}
                onClick={() => onEditStep?.(3)}
                className={`mt-2 w-full py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  isStep3Valid 
                    ? "bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white" 
                    : "bg-brand-gradient text-white hover:brightness-110 shadow-glow"
                }`}
              >
                {isStep3Valid ? "Edit" : "Complete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Label */}
      {!hideChecklist && (
        <div className="mt-8 mb-4">
          <p className="text-[10px] font-black text-[var(--brand-2)] uppercase tracking-widest">Organizer Live Preview</p>
          <h2 className="text-sm font-black text-white/40 mt-0.5">Real-time simulation of published event</h2>
        </div>
      )}

      {/* Main Glassmorphic Wrapper */}
      <div className="liquid-glass liquid-edge rounded-[24px] overflow-hidden flex flex-col shadow-glow border border-border">
        
        {/* Banner Hero Image */}
        <div 
          className="relative h-48 sm:h-56 bg-cover bg-center flex flex-col justify-end p-6"
          style={{ backgroundImage: data.bannerUrl ? `url(${data.bannerUrl})` : "none" }}
        >
          {!data.bannerUrl && (
            <div className="absolute inset-0 bg-white/5 flex items-center justify-center text-white/20 text-xs font-bold z-0">
              No Cover Banner Selected
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent z-0" />
          <div className="absolute inset-0 bg-brand-gradient/10 z-0" />

          {/* Glowing Radial Backdrop Sweep */}
          <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[60%] rounded-full bg-[var(--brand-2)]/25 blur-[90px] pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 w-full">
            <div className="flex flex-col gap-2.5 flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-white/10 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest border border-white/5">
                  {data.category ?? "Category"}
                </span>
                {data.ageGroup && data.ageGroup !== "All Ages" && (
                  <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 backdrop-blur-md text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-500/5">
                    {data.ageGroup}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight text-shadow-glow break-words">
                {data.title || "Untitled Event"}
              </h1>

              {/* Organizer Row */}
              <div className="flex items-center gap-2 mt-1">
                <div className="h-6 w-6 rounded-full bg-brand-gradient flex items-center justify-center font-black text-[9px] text-white">
                  Y
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white/95">Hosted by You</span>
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--brand-3)]" />
                </div>
              </div>
            </div>

            {/* Price Tag */}
            <div className="flex items-center gap-3">
              <div className="flex flex-col sm:items-end">
                <span className="text-[8px] text-white/40 uppercase font-black tracking-widest leading-none">Price</span>
                <span className="text-sm font-black text-white leading-tight mt-0.5">
                  {ticketing.mode === "guestlist" ? "Guestlist" : ticketing.mode === "free" ? "Free" : ticketing.tiers?.[0]?.price ? `₹${ticketing.tiers[0].price}` : "Free"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Action Tabs Panel */}
        <div className="flex border-b border-white/10 bg-white/[0.02]">
          {(["about", "lineup", "faq"] as const).map((tab) => (
            <Button
              key={tab}
              type="button"
              variant="ghost"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider transition-all duration-300 relative cursor-pointer ${
                activeTab === tab 
                  ? "text-white text-shadow-glow" 
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {tab === "about" && "The Details"}
              {tab === "lineup" && "Lineup"}
              {tab === "faq" && "FAQs & Policies"}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-gradient shadow-glow" />
              )}
            </Button>
          ))}
        </div>

        {/* Tab Context Content Viewports */}
        <div className="p-6 flex flex-col gap-6 bg-[#050508]/40">
          
          {/* Tab 1: Details */}
          {activeTab === "about" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              
              {/* Quick Metadata Info Tags */}
              <div className="flex flex-wrap gap-2 text-xs">
                {dresscode.enabled && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold">
                    <Shirt className="h-3.5 w-3.5" /> Dress Code: {dresscode.style || "Required"}
                  </span>
                )}
                {data.tags && data.tags.length > 0 && data.tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/50">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Schedule and Location widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-[var(--brand-1)]/10 text-[var(--brand-1)] flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase tracking-wider font-black text-white/30">Schedule Event</h4>
                    <p className="text-sm font-black text-white mt-1">
                      {schedule.startDate || "Start Date"} 
                      {schedule.endDate && schedule.endDate !== schedule.startDate && ` - ${schedule.endDate}`}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">
                      {schedule.startTime || "Start Time"}{schedule.endTime ? ` - ${schedule.endTime}` : ""}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-[var(--brand-3)]/10 text-[var(--brand-3)] flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[10px] uppercase tracking-wider font-black text-white/30">Venue Address</h4>
                    <p className="text-sm font-black text-white mt-1 truncate">{location.venue || "Venue Name"}</p>
                    <p className="text-xs text-white/50 mt-0.5 truncate">{location.address || "Full Address"}</p>
                  </div>
                </div>
              </div>

              {/* About description */}
              <div className="p-4.5 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <h4 className="text-xs font-black uppercase tracking-wider text-white/40 mb-2.5 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-[var(--brand-2)]" /> About the experience
                </h4>
                <p className="text-sm text-white/80 leading-relaxed font-medium whitespace-pre-wrap">
                  {data.description || "No event description provided yet."}
                </p>
              </div>

              {/* Event Gallery / Highlights */}
              {data.highlights && data.highlights.filter(Boolean).length > 0 && (
                <div className="p-4.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex flex-col gap-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-[var(--brand-3)]" /> Event Highlights
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {data.highlights.filter(Boolean).map((imgUrl, i) => (
                      <div 
                        key={i} 
                        className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group cursor-pointer hover:border-white/20 transition-all duration-300"
                      >
                        <img 
                          src={imgUrl} 
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  {data.highlightText && (
                    <p className="text-[11px] text-white/50 mt-1 leading-relaxed">{data.highlightText}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Lineup */}
          {activeTab === "lineup" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <h4 className="text-xs font-black uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                <Music className="h-3.5 w-3.5 text-[var(--brand-1)]" /> Artist Lineup
              </h4>
              {data.artists && data.artists.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {data.artists.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] transition-all w-full sm:w-[48%]">
                      <div className="h-10 w-10 rounded-full bg-brand-gradient flex items-center justify-center font-black text-xs text-white">
                        {a[0]?.toUpperCase() || "A"}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white">{a}</p>
                        <p className="text-[10px] text-white/40 mt-0.5">Performing Artist</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/30 italic">No artists added yet.</p>
              )}
            </div>
          )}

          {/* Tab 3: FAQs & Policies */}
          {activeTab === "faq" && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-200">
              {/* Ticket Tiers */}
              {ticketing.mode === "paid" && (
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white/40">Ticket Tiers</h4>
                  {ticketing.tiers && ticketing.tiers.length > 0 ? (
                    <div className="space-y-2">
                      {ticketing.tiers.map((tier) => (
                        <div key={tier.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                          <div>
                            <p className="text-xs font-black text-white">{tier.name || tier.entryType}</p>
                            {tier.promoText && <p className="text-[10px] text-[var(--brand-1)] mt-0.5">{tier.promoText}</p>}
                            <p className="text-[10px] text-white/30 mt-0.5">{tier.inventory} seats available</p>
                          </div>
                          <p className="text-sm font-black text-white">₹{tier.price.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/30 italic">No pricing tiers added yet.</p>
                  )}
                </div>
              )}

              {/* Services */}
              {data.services && data.services.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white/40">Services Provided</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.services.map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQs */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-white/40">Frequently Asked Questions</h4>
                {policies.faqs && policies.faqs.filter(f => f.question).length > 0 ? (
                  <div className="space-y-2">
                    {policies.faqs.filter(f => f.question).map((faq) => (
                      <div key={faq.id} className="px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-[11px] font-bold text-white">{faq.question}</p>
                        {faq.answer && <p className="text-[10px] text-white/50 mt-1 leading-relaxed">{faq.answer}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/30 italic">No FAQs added yet.</p>
                )}
              </div>

              {/* Terms & Conditions */}
              {policies.termsAndConditions && (
                <div className="px-4 py-3 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-wider mb-1">Terms & Conditions</p>
                  <p className="text-[10px] text-white/30 leading-relaxed">{policies.termsAndConditions}</p>
                </div>
              )}

              {/* Privacy Policy */}
              {policies.privacyPolicy && (
                <div className="px-4 py-3 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-wider mb-1">Privacy Policy</p>
                  <p className="text-[10px] text-white/30 leading-relaxed">{policies.privacyPolicy}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Returns a list of publish-blocking error messages */
export function getPublishErrors(data: Partial<CreatedEventType>): string[] {
  const errs: string[] = [];
  const schedule = data.schedule || { startDate: "", endDate: "", startTime: "", endTime: "" };
  const location = data.location || { venue: "", address: "", lat: null, lng: null };
  const ticketing = data.ticketing || { mode: "free", capacity: 100, capacityFlex: false, tiers: [], promoCodes: [], price: "" };

  if (!data.title?.trim()) errs.push("Event name is required");
  if (!data.bannerUrl?.trim()) errs.push("Cover image is required");
  if (!schedule.startDate) errs.push("Start date is required");
  if (!schedule.startTime) errs.push("Start time is required");
  if (!location.address?.trim()) errs.push("Full address is required");
  if (!data.description?.trim()) errs.push("Event description is required");
  if (!data.highlights?.some(Boolean)) errs.push("At least one highlight image is required");
  if ((data.tags ?? []).length < 2) errs.push("At least 2 event tags are required");
  if (ticketing.mode === "paid" && (ticketing.tiers ?? []).length === 0) {
    errs.push("At least one ticket tier is required for paid events");
  }
  return errs;
}
