"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLayout } from "@/components/layout/AppLayout";
import { 
  Ticket, 
  Compass, 
  MapPin, 
  Calendar, 
  Clock, 
  QrCode, 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Info,
  ChevronRight,
  Share2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { EVENT_META } from "@/constants/mockData";

export default function MyBookingsPage() {
  const router = useRouter();
  const { bookedTickets } = useLayout();
  
  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  
  // Selected ticket for modal viewing
  const [selectedTicket, setSelectedTicket] = useState<typeof bookedTickets[0] | null>(null);

  // Helper to match ticket metadata
  const getMeta = (ticket: typeof bookedTickets[0]) => {
    // Use real backend cover image if available
    const realCover = ticket.coverImageUrl;
    const realVenue = ticket.venue;

    // Strip ticket tier suffixes like " (General Entry)" or " (VIP Access Pass)" if present
    const cleanedTitle = ticket.eventTitle.replace(/\s*\(.*?\)\s*$/, "");
    const key = cleanedTitle.toLowerCase();
    const mockMeta = EVENT_META[key];

    return {
      banner: realCover || mockMeta?.banner || "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=600&q=80",
      venue: realVenue || mockMeta?.venue || "Main Venue, HappniX Space",
      locationLink: mockMeta?.locationLink || `https://maps.google.com/?q=${encodeURIComponent(realVenue || cleanedTitle)}`,
      instructions: mockMeta?.instructions || ["Show ticket code at the entrance gate.", "Enjoy the night safely! Respect others."]
    };
  };

  return (
    <div className="flex-1 flex flex-col gap-6 select-none animate-in fade-in duration-300 min-w-0 w-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[9px] font-black tracking-widest text-[var(--brand-3)] uppercase text-shadow-glow">My Bookings</span>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">Booked Passes</h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 w-full sm:w-fit self-start sm:self-auto">
          <Button 
            onClick={() => setActiveTab("upcoming")}
            variant="ghost"
            className={`flex-1 sm:flex-none px-4 py-1.5 h-auto rounded-lg text-xs font-black uppercase tracking-wider transition-all text-center ${
              activeTab === "upcoming" 
                ? "bg-white/10 text-white text-shadow-glow hover:bg-white/10 hover:text-white" 
                : "text-white/40 hover:text-white/70"
            }`}
          >
            Active Passes ({bookedTickets.length})
          </Button>
          <Button 
            onClick={() => setActiveTab("past")}
            variant="ghost"
            className={`flex-1 sm:flex-none px-4 py-1.5 h-auto rounded-lg text-xs font-black uppercase tracking-wider transition-all text-center ${
              activeTab === "past" 
                ? "bg-white/10 text-white text-shadow-glow hover:bg-white/10 hover:text-white" 
                : "text-white/40 hover:text-white/70"
            }`}
          >
            History (0)
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === "past" || bookedTickets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[50vh] liquid-glass liquid-edge rounded-[24px] shadow-glow">
          <div className="h-14 w-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white/40">
            <Ticket className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            {activeTab === "past" ? "No Past Entries" : "No Booked Passes"}
          </h3>
          <p className="text-[11px] text-white/50 mt-1.5 max-w-xs leading-relaxed">
            {activeTab === "past" 
              ? "All your completed gigs, rave tickets, and social pass history will show up here."
              : "You haven't secured any gig or rave entries yet. Browse the home feed to find your next night-out experience."}
          </p>
          {activeTab === "upcoming" && (
            <Button 
              onClick={() => router.push("/home")}
              variant="brand"
              size="lg"
              className="mt-5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
            >
              <Compass className="h-4 w-4" /> Explore Events
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-6 justify-center sm:justify-start">
          {bookedTickets.map((t) => {
            const meta = getMeta(t);
            const isActive = !t.status || t.status === "Pending" || t.status === "Confirmed";
            const statusLabel = t.status === "Cancelled" ? "Cancelled" : "Active Pass";
            return (
              <div 
                key={t.id} 
                onClick={() => setSelectedTicket(t)}
                className="group relative w-full max-w-[280px] rounded-md border border-white/10 bg-white/[0.02] flex flex-col liquid-glass liquid-edge hover:shadow-[0_0_30px_rgba(201,108,255,0.15)] hover:border-white/20 hover:-translate-y-1.5 cursor-pointer overflow-hidden min-h-[385px] transition-all duration-300"
              >
                {/* Event banner image stub */}
                <div 
                  className="h-32 bg-cover bg-center p-4.5 flex flex-col justify-between relative overflow-hidden shrink-0"
                  style={{ backgroundImage: `url(${meta.banner})` }}
                >
                  <div className="absolute inset-0 bg-black/50" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/90 to-transparent" />
                  
                  <div className="relative z-10 flex justify-between items-start">
                    <span className={`px-2 py-0.5 rounded text-white text-[8px] font-black uppercase tracking-widest border border-white/10 shadow-glow ${
                      isActive ? 'bg-brand-gradient' : 'bg-red-500/80'
                    }`}>
                      {statusLabel}
                    </span>
                    <span className="text-[8px] text-white/50 font-black tracking-widest uppercase">HNX-{t.id.slice(-6).toUpperCase()}</span>
                  </div>
                  
                  <div className="relative z-10">
                    <h4 className="text-xs font-black text-white leading-tight uppercase tracking-wider line-clamp-2 text-shadow-glow">
                      {t.eventTitle}
                    </h4>
                    <span className="text-[8px] text-[var(--brand-3)] font-black tracking-widest uppercase mt-0.5 block flex items-center gap-1">
                      <MapPin className="h-2 w-2" /> {meta.venue.split(",")[0]}
                    </span>
                  </div>
                </div>

                {/* Details Content Section */}
                <div className="p-4.5 flex flex-col gap-3.5 text-left flex-1 justify-center relative bg-white/[0.01]">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-white/35 block uppercase tracking-wider text-[7px] font-black">Date</span>
                      <span className="text-xs font-bold text-white mt-0.5 block">{t.date}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white/35 block uppercase tracking-wider text-[7px] font-black">Door Opens</span>
                      <span className="text-xs font-bold text-white mt-0.5 block">{t.time}</span>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-3.5 flex justify-between items-center">
                    <div>
                      <span className="text-white/35 block uppercase tracking-wider text-[7px] font-black">Access Type</span>
                      <span className="text-[10px] text-[var(--brand-1)] font-black uppercase tracking-wider mt-0.5 block">{t.seat}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white/35 block uppercase tracking-wider text-[7px] font-black">Admission</span>
                      <span className="text-xs font-bold text-white mt-0.5 block">1 Guest</span>
                    </div>
                  </div>
                </div>

                {/* Dashed divider tear line & centered side cut-out notches */}
                <div className="relative h-px w-full border-t border-dashed border-white/20 my-0.5">
                  <div className="absolute -top-2.5 -left-2.5 h-5 w-5 rounded-full bg-[#050508] border border-white/10" />
                  <div className="absolute -top-2.5 -right-2.5 h-5 w-5 rounded-full bg-[#050508] border border-white/10" />
                </div>

                {/* Barcode Stub Footer */}
                <div className="p-4 bg-white/[0.02] flex flex-col items-center gap-2 group-hover:bg-white/[0.04] transition-colors duration-300">
                  <div className="relative h-10 w-full flex items-center justify-between opacity-30 group-hover:opacity-40 gap-[2.5px] px-3 transition-opacity">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <div 
                        key={i} 
                        className="bg-white h-full" 
                        style={{ width: `${(i % 4 === 0 ? 3 : i % 3 === 0 ? 1 : 2)}px` }}
                      />
                    ))}
                  </div>
                  <span className="text-[8px] text-white/40 uppercase tracking-widest font-black flex items-center gap-1 group-hover:text-[var(--brand-2)] transition-colors">
                    <QrCode className="h-3 w-3" /> Tap to Scan
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket QR Modal / Digital Wallet Overlay */}
      {selectedTicket && (() => {
        const meta = getMeta(selectedTicket);
        return (
          <div 
            onClick={() => setSelectedTicket(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
          >
            {/* Modal Box / Floating 2-Column Ticket Stub */}
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[580px] rounded-[28px] border border-white/10 bg-gradient-to-b from-[#14141d] to-[#08080c] flex flex-col md:flex-row shadow-[0_0_60px_rgba(201,108,255,0.25)] overflow-hidden animate-in zoom-in-95 duration-300 cursor-default"
            >
              {/* Sleek Floating Close Button */}
              <Button 
                onClick={() => setSelectedTicket(null)}
                variant="ghost"
                size="icon"
                className="absolute top-3.5 right-3.5 z-20 h-8 w-8 rounded-full bg-black/50 hover:bg-white/10 text-white/60 hover:text-white border border-white/10"
              >
                <X className="h-3.5 w-3.5" />
              </Button>

              {/* Left Column: QR Code Stub */}
              <div className="w-full md:w-[220px] bg-white/[0.01] p-6 flex flex-col items-center justify-center border-b md:border-b-0 border-white/10 shrink-0 text-center relative">
                
                {/* High Contrast Scannable Card */}
                <div className="bg-white p-4 rounded-[20px] shadow-2xl flex flex-col items-center gap-1.5 border border-white/10 w-full max-w-[170px] hover:scale-102 transition-transform duration-300 mt-2 md:mt-0">
                  {/* Styled QR Code Matrix */}
                  <div className="h-28 w-28 grid grid-cols-6 grid-rows-6 gap-0.5 relative opacity-95">
                    {/* Finder 1 */}
                    <div className="col-start-1 col-end-3 row-start-1 row-end-3 bg-neutral-900 rounded flex items-center justify-center">
                      <div className="h-6 w-6 bg-white rounded-sm flex items-center justify-center">
                        <div className="h-3 w-3 bg-neutral-900 rounded-sm" />
                      </div>
                    </div>
                    {/* Finder 2 */}
                    <div className="col-start-5 col-end-7 row-start-1 row-end-3 bg-neutral-900 rounded flex items-center justify-center">
                      <div className="h-6 w-6 bg-white rounded-sm flex items-center justify-center">
                        <div className="h-3 w-3 bg-neutral-900 rounded-sm" />
                      </div>
                    </div>
                    {/* Finder 3 */}
                    <div className="col-start-1 col-end-3 row-start-5 row-end-7 bg-neutral-900 rounded flex items-center justify-center">
                      <div className="h-6 w-6 bg-white rounded-sm flex items-center justify-center">
                        <div className="h-3 w-3 bg-neutral-900 rounded-sm" />
                      </div>
                    </div>
                    {/* Data modules */}
                    <div className="col-start-3 row-start-1 bg-neutral-900 rounded-sm" />
                    <div className="col-start-4 row-start-2 bg-neutral-900 rounded-sm" />
                    <div className="col-start-3 col-end-5 row-start-3 bg-neutral-900 rounded-sm" />
                    <div className="col-start-1 row-start-3 bg-neutral-900 rounded-sm" />
                    <div className="col-start-2 row-start-4 bg-neutral-900 rounded-sm" />
                    <div className="col-start-5 row-start-4 bg-neutral-900 rounded-sm" />
                    <div className="col-start-6 row-start-3 bg-neutral-900 rounded-sm" />
                    <div className="col-start-3 row-start-5 bg-neutral-900 rounded-sm" />
                    <div className="col-start-4 row-start-6 bg-neutral-900 rounded-sm" />
                    <div className="col-start-5 col-end-7 row-start-5 bg-neutral-900 rounded-sm" />
                  </div>

                  <span className="text-[7.5px] font-black uppercase tracking-wider text-neutral-500 mt-1">
                    Scan At Entrance
                  </span>
                </div>
              </div>

              {/* Vertical divider line and notches for desktop */}
              <div className="absolute left-[220px] top-0 bottom-0 w-px border-l border-dashed border-white/10 hidden md:block pointer-events-none">
                <div className="absolute -top-2.5 -left-2.5 h-5 w-5 rounded-full bg-[#050508] border border-white/10" />
                <div className="absolute -bottom-2.5 -left-2.5 h-5 w-5 rounded-full bg-[#050508] border border-white/10" />
              </div>

              {/* Horizontal divider line and notches for mobile */}
              <div className="relative h-px w-full border-t border-dashed border-white/10 md:hidden pointer-events-none">
                <div className="absolute -top-2.5 -left-2.5 h-5 w-5 rounded-full bg-[#050508] border border-white/10" />
                <div className="absolute -top-2.5 -right-2.5 h-5 w-5 rounded-full bg-[#050508] border border-white/10" />
              </div>

              {/* Right Column: Event Details */}
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                {/* Event header cover */}
                <div 
                  className="h-28 bg-cover bg-center p-5 flex flex-col justify-end relative overflow-hidden"
                  style={{ backgroundImage: `url(${meta.banner})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#14141d] via-black/55 to-black/20" />
                  
                  <div className="relative z-10">
                    <span className="px-2 py-0.5 rounded bg-[var(--brand-1)] text-white text-[8px] font-black uppercase tracking-widest border border-white/10 shadow-glow">
                      {selectedTicket.seat}
                    </span>
                    <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wider mt-1.5 text-shadow-glow line-clamp-1 leading-tight">
                      {selectedTicket.eventTitle}
                    </h3>
                  </div>
                </div>

                {/* Details list info */}
                <div className="p-5 flex flex-col gap-4">
                  {/* Grid details details */}
                  <div className="grid grid-cols-2 gap-3 pb-3.5 border-b border-white/5">
                    <div className="bg-white/[0.02] border border-white/[0.06] p-2.5 rounded-xl">
                      <span className="text-white/35 block uppercase tracking-wider text-[7px] font-black flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-[var(--brand-1)]" /> Date
                      </span>
                      <span className="font-bold text-white block mt-0.5 text-xs">{selectedTicket.date}</span>
                    </div>

                    <div className="bg-white/[0.02] border border-white/[0.06] p-2.5 rounded-xl">
                      <span className="text-white/35 block uppercase tracking-wider text-[7px] font-black flex items-center gap-1">
                        <Clock className="h-3 w-3 text-[var(--brand-2)]" /> Door Time
                      </span>
                      <span className="font-bold text-white block mt-0.5 text-xs">{selectedTicket.time}</span>
                    </div>

                    <div className="bg-white/[0.02] border border-white/[0.06] p-2.5 rounded-xl col-span-2 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <span className="text-white/35 block uppercase tracking-wider text-[7px] font-black flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-[var(--brand-3)]" /> Venue Address
                        </span>
                        <span className="font-bold text-white block mt-0.5 text-xs truncate max-w-[200px] md:max-w-[240px]">{meta.venue}</span>
                      </div>
                      <Button 
                        onClick={() => window.open(meta.locationLink, "_blank")}
                        variant="outline"
                        size="sm"
                        className="px-3 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shrink-0"
                      >
                        <span>Maps</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Ground rules & guidelines */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-white/35 uppercase tracking-wider text-[8px] font-black flex items-center gap-1">
                      <Info className="h-3 w-3 text-[var(--brand-2)]" /> Entry Information & Guidelines
                    </span>
                    <div className="flex flex-col gap-1 pl-1">
                      {meta.instructions.map((inst, i) => (
                        <p key={i} className="text-[10px] text-white/60 leading-tight flex items-start gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-[var(--brand-3)] mt-1.5 shrink-0" />
                          <span>{inst}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
