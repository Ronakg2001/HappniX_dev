"use client";

import React, { useState, useEffect } from "react";
import { X, Bell, Ticket, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLayout } from "@/components/layout/AppLayout";
import { bookingApi } from "@/lib/api";
import { MOCK_EVENTS } from "@/constants/mockData";

// --- QUICK NOTIFICATIONS MODAL ---
export function NotificationsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  const notifications = [
    { id: 1, type: "follow", text: "Aria Roy requested to follow you", time: "2m ago", action: true },
    { id: 2, type: "like", text: "Sarah Connor liked your post", time: "15m ago" },
    { id: 3, type: "event", text: "Tickets for Club Utopia DJ Set are selling out fast!", time: "1h ago" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-md rounded-lg liquid-glass liquid-edge border border-border p-5 shadow-card max-h-[80vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-[var(--brand-1)]" />
            Activity Center
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-foreground/10 text-foreground/50 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {notifications.map((n) => (
            <div key={n.id} className="p-3 rounded-md bg-foreground/5 border border-border flex items-start gap-3 justify-between">
              <div>
                <p className="text-xs text-foreground/90">{n.text}</p>
                <span className="text-[10px] text-foreground/40 mt-1 block">{n.time}</span>
              </div>
              {n.action && (
                <div className="flex gap-1 shrink-0">
                  <button className="px-2.5 py-1 rounded-lg bg-brand-gradient text-white text-[10px] font-bold shadow-glow hover:scale-102">
                    Accept
                  </button>
                  <button className="px-2.5 py-1 rounded-lg bg-foreground/10 text-foreground/70 text-[10px] font-bold hover:bg-foreground/15">
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- QUICK PROFILE PREVIEW ---
export function ProfilePreviewModal({ isOpen, onClose, username }: { isOpen: boolean; onClose: () => void; username: string }) {
  const router = useRouter();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-lg liquid-glass liquid-edge border border-border p-5 shadow-card animate-in zoom-in-95 duration-200 text-center">
        <div className="flex justify-end">
          <button onClick={onClose} className="p-1 rounded-full hover:bg-foreground/10 text-foreground/50 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-16 w-16 mx-auto rounded-full bg-brand-gradient flex items-center justify-center font-bold text-lg border border-border text-white mb-3">
          {username[0]?.toUpperCase() || "U"}
        </div>
        <h3 className="text-base font-bold text-foreground">@{username}</h3>
        <p className="text-xs text-foreground/60 mt-1 px-4 leading-relaxed">
          Lives for live gigs, techno nights, and discovering secret party venues around town. Let's explore!
        </p>
        <div className="flex justify-center gap-6 my-4 border-y border-border py-3">
          <div>
            <p className="text-xs text-foreground/40 uppercase font-semibold">Followers</p>
            <p className="text-sm font-bold text-foreground">1.2K</p>
          </div>
          <div>
            <p className="text-xs text-foreground/40 uppercase font-semibold">Events</p>
            <p className="text-sm font-bold text-foreground">24</p>
          </div>
        </div>
        <button 
          onClick={() => {
            onClose();
            router.push("/profile");
          }}
          className="w-full py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-glow hover:scale-102 transition-all cursor-pointer"
        >
          View Full Profile
        </button>
      </div>
    </div>
  );
}

// --- QUICK EVENT PREVIEW ---
export function EventPreviewModal({ isOpen, onClose, eventTitle, eventID }: { isOpen: boolean; onClose: () => void; eventTitle: string; eventID?: string }) {
  const { openBooking } = useLayout();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-md rounded-lg liquid-glass liquid-edge border border-border p-5 shadow-card animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-base font-bold text-foreground">{eventTitle}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-foreground/10 text-foreground/50 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-foreground/70 mb-4 leading-relaxed">
          The ultimate immersive sound experience featuring local underground talent, stellar light projections, and the best crowd in the city. Don't miss this!
        </p>
        <button 
          onClick={() => {
            onClose();
            openBooking(eventTitle, "₹999", eventID);
          }}
          className="w-full py-3 rounded-2xl bg-brand-gradient text-white text-xs font-bold shadow-glow hover:scale-102 cursor-pointer"
        >
          View Event Details
        </button>
      </div>
    </div>
  );
}

// --- MINI BOOKING MODAL ---
export function BookingModal({ isOpen, onClose, eventTitle, price, eventID }: { isOpen: boolean; onClose: () => void; eventTitle: string; price: string; eventID?: string }) {
  const router = useRouter();
  const { addTicket, refreshBookings, bookedTickets } = useLayout();
  // Check if user already has an active pass for this event
  const hasActiveTicket = Boolean(
    eventID &&
    bookedTickets?.some(
      (t: any) => t.eventID === eventID && (t.status === "Confirmed" || t.status === "Pending" || !t.status)
    )
  );

  // Booking States (1 ticket per user strictly enforced)
  const qty = 1;
  const [category, setCategory] = useState<"general" | "vip" | "backstage">("general");
  const [promoCode, setPromoCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [stage, setStage] = useState<"checkout" | "processing" | "confirmed" | "error">("checkout");
  const [processMsg, setProcessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Real tiers fetched from backend or local storage
  const [realTiers, setRealTiers] = useState<any[]>([]);
  const [selectedTierID, setSelectedTierID] = useState<string | null>(null);

  // Fetch real tiers when modal opens
  useEffect(() => {
    if (!isOpen || !eventID) {
      setRealTiers([]);
      setSelectedTierID(null);
      return;
    }

    const loadLocalTiers = () => {
      try {
        const created = JSON.parse(localStorage.getItem("happnix_created_events_v4") || "[]");
        const cached = JSON.parse(localStorage.getItem("happnix_cached_feed_events") || "[]");
        const match = [...created, ...cached, ...MOCK_EVENTS].find((e: any) => (e.eventID || e.id) === eventID);
        const tiers = match?.ticketing?.tiers || match?.ticketTiers || [];
        if (Array.isArray(tiers) && tiers.length > 0) {
          const mapped = tiers.map((t: any) => ({
            tierID: t.id || t.tierID || `tier_${Math.random()}`,
            name: t.name || "General Admission",
            price: Number(t.price) || 0,
            description: t.promoText || t.description || ""
          }));
          setRealTiers(mapped);
          setSelectedTierID(mapped[0].tierID);
          return true;
        }
      } catch {
        // ignore storage errors
      }
      return false;
    };

    // First check local/mock storage so tiers load immediately
    const foundLocal = loadLocalTiers();

    // Also attempt backend API if UUID
    if (!eventID.startsWith("e") && !eventID.startsWith("c_")) {
      bookingApi.getEventTiers(eventID).then((res: any) => {
        if (res.success && res.tiers?.length > 0) {
          setRealTiers(res.tiers);
          setSelectedTierID(res.tiers[0].tierID);
        } else if (!foundLocal) {
          setRealTiers([]);
        }
      }).catch(() => {
        if (!foundLocal) setRealTiers([]);
      });
    }
  }, [isOpen, eventID]);

  if (!isOpen) return null;

  // Pricing calculations
  const rawBase = parseInt(price.replace(/[^\d]/g, "")) || 499;
  
  let basePrice = rawBase;
  let categoryLabel = "General Admission";

  if (realTiers.length > 0) {
    const selectedTier = realTiers.find(t => t.tierID === selectedTierID) || realTiers[0];
    basePrice = selectedTier ? Number(selectedTier.price) || 0 : rawBase;
    categoryLabel = selectedTier ? selectedTier.name : "General Admission";
  } else {
    if (category === "vip") {
      basePrice = rawBase + 500;
      categoryLabel = "VIP Access Pass";
    } else if (category === "backstage") {
      basePrice = rawBase + 1200;
      categoryLabel = "Backstage Pass";
    }
  }

  const subtotal = basePrice * qty;
  const discount = discountApplied ? Math.round(subtotal * 0.20) : 0;
  const serviceFee = basePrice === 0 ? 0 : Math.round((subtotal - discount) * 0.05);
  const total = subtotal - discount + serviceFee;
  const isFree = total === 0;

  const handleApplyPromo = () => {
    setPromoError("");
    const code = promoCode.trim().toUpperCase();
    if (code === "HAPPNIX" || code === "SQUAD") {
      setDiscountApplied(true);
    } else {
      setPromoError("Invalid code. Try HAPPNIX");
      setDiscountApplied(false);
    }
  };

  const handleBooking = async () => {
    setStage("processing");
    setProcessMsg("Securing spot with venue hosts...");

    const isBackendEvent = Boolean(eventID && !eventID.startsWith("e") && !eventID.startsWith("c_"));
    if (isBackendEvent && selectedTierID && eventID) {
      try {
        setTimeout(() => setProcessMsg("Generating secure gate QR keys..."), 800);

        const res = await bookingApi.bookTicket({
          eventID: eventID,
          tierID: selectedTierID,
          quantity: 1,
        }) as any;

        if (res.success) {
          setProcessMsg("Authorizing secure check-out transaction...");
          await new Promise(r => setTimeout(r, 600));
          await refreshBookings();
          setStage("confirmed");
        } else {
          setErrorMsg(res.error || res.message || "Booking failed. Please try again.");
          setStage("error");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Booking failed. Please try again.");
        setStage("error");
      }
    } else {
      setTimeout(() => setProcessMsg("Generating secure gate QR keys..."), 800);
      setTimeout(() => setProcessMsg("Authorizing secure check-out transaction..."), 1600);
      setTimeout(() => {
        addTicket(`${eventTitle} (${categoryLabel})`, isFree ? "FREE" : `₹${total}`, eventID);
        setStage("confirmed");
      }, 2400);
    }
  };

  const handleClose = () => {
    setCategory("general");
    setPromoCode("");
    setDiscountApplied(false);
    setPromoError("");
    setStage("checkout");
    setErrorMsg("");
    setRealTiers([]);
    setSelectedTierID(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-[24px] liquid-glass liquid-edge border border-white/10 p-6 shadow-glow animate-in zoom-in-95 duration-200 select-none">
        
        {/* Stage 1: Checkout Form */}
        {stage === "checkout" && (
          <>
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[9px] font-black tracking-widest text-[var(--brand-1)] uppercase text-shadow-glow">Pass Checkout</span>
                <h3 className="text-sm font-extrabold text-white leading-tight mt-0.5">{eventTitle}</h3>
              </div>
              <button onClick={handleClose} className="p-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white cursor-pointer active:scale-95 transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>

            {hasActiveTicket ? (
              <div className="py-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3.5">
                  <Ticket className="h-6 w-6 animate-pulse" />
                </div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Active Pass Found</h4>
                <p className="text-xs text-white/60 mt-2 leading-relaxed px-1">
                  You already hold an active pass for this event. To book a different ticket tier or re-book, please cancel your existing pass first.
                </p>
                <button
                  onClick={() => {
                    handleClose();
                    router.push("/my-bookings");
                  }}
                  className="w-full mt-6 py-3 rounded-xl bg-brand-gradient text-white text-xs font-black shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  View My Bookings
                </button>
              </div>
            ) : (
              <>
                {/* Ticket Categories/Tiers */}
                <div className="flex flex-col gap-2 mb-4">
                  <label className="text-[10px] font-black uppercase tracking-wider text-white/40">Select Ticket Class</label>
                  
                  {realTiers.length > 0 ? (
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {realTiers.map((tier) => {
                        const tierPrice = Number(tier.price) || 0;
                        const isSelected = selectedTierID === tier.tierID;
                        return (
                          <button
                            key={tier.tierID}
                            onClick={() => setSelectedTierID(tier.tierID)}
                            className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer outline-none text-left ${
                              isSelected
                                ? "bg-brand-gradient/20 border-[var(--brand-1)] text-white shadow-glow"
                                : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <span className="text-xs font-bold block truncate">{tier.name}</span>
                              {tier.description && (
                                <span className="text-[10px] text-white/40 block truncate mt-0.5">{tier.description}</span>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-xs font-black ${tierPrice === 0 ? "text-green-400" : "text-white"}`}>
                                {tierPrice === 0 ? "FREE" : `₹${tierPrice}`}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "general", label: "General", desc: `₹${rawBase}` },
                        { id: "vip", label: "VIP Pass", desc: `₹${rawBase + 500}` },
                        { id: "backstage", label: "Backstage", desc: `₹${rawBase + 1200}` }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setCategory(t.id as any)}
                          className={`p-2.5 rounded-full border flex flex-col items-center justify-center transition-all cursor-pointer outline-none focus:outline-none ${
                            category === t.id
                              ? "bg-brand-gradient/20 border-[var(--brand-1)] text-white shadow-glow"
                              : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                          }`}
                        >
                          <span className="text-xs font-bold leading-tight">{t.label}</span>
                          <span className="text-[10px] text-white/40 mt-0.5">{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Single Pass Policy Notice */}
                <div className="flex items-center justify-between py-2.5 px-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
                  <span className="text-xs font-bold text-white/70">Individual Pass Allocation</span>
                  <span className="text-xs font-black text-[var(--brand-2)] bg-[var(--brand-2)]/10 px-2.5 py-1 rounded-lg">1 Person Limit</span>
                </div>

                {/* Promo Code section */}
                {!isFree && (
                  <div className="flex flex-col gap-1.5 mb-4">
                    <label className="text-[10px] font-black uppercase tracking-wider text-white/40">Apply Promo Code</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Code (e.g. HAPPNIX)"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        disabled={discountApplied}
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-[var(--brand-2)] text-white placeholder-white/20 disabled:opacity-50 uppercase tracking-widest font-black"
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={!promoCode || discountApplied}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-black text-white cursor-pointer active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                      >
                        {discountApplied ? "Applied" : "Apply"}
                      </button>
                    </div>
                    {promoError && <p className="text-[9px] font-bold text-red-400">{promoError}</p>}
                    {discountApplied && <p className="text-[9px] font-black text-green-400">✓ 20% discount applied successfully!</p>}
                  </div>
                )}

                {/* Dynamic Receipt Pricing Details */}
                <div className="space-y-2 mb-6 text-xs text-white/60 p-3.5 rounded-md bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex justify-between">
                    <span>{categoryLabel} (1x Pass)</span>
                    <span>{isFree ? "FREE" : `₹${subtotal}`}</span>
                  </div>
                  {discountApplied && !isFree && (
                    <div className="flex justify-between text-green-400 font-medium">
                      <span>Promo Discount (-20%)</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}
                  {!isFree && (
                    <div className="flex justify-between">
                      <span>Service processing fee (5%)</span>
                      <span>₹{serviceFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-white text-sm border-t border-white/[0.08] pt-2 mt-2">
                    <span>Total Amount</span>
                    <span className="text-brand-gradient text-shadow-glow font-black text-base">{isFree ? "FREE" : `₹${total}`}</span>
                  </div>
                </div>

                <button
                  onClick={handleBooking}
                  className="w-full py-3.5 rounded-2xl bg-brand-gradient text-white text-xs font-black shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all hover:shadow-[0_0_20px_rgba(255,79,216,0.4)] cursor-pointer"
                >
                  {isFree ? "Claim Free Pass" : "Pay & Confirm Transaction"}
                </button>
              </>
            )}
          </>
        )}

        {/* Stage 2: Processing Payment Loader */}
        {stage === "processing" && (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in duration-300">
            <div className="relative mb-5 flex items-center justify-center">
              <span className="absolute h-12 w-12 rounded-full border-4 border-white/5 border-t-[var(--brand-1)] animate-spin" />
              <Ticket className="h-6 w-6 text-white animate-pulse" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Securing Pass</h3>
            <p className="text-[11px] text-white/45 mt-2 animate-pulse">{processMsg}</p>
          </div>
        )}

        {/* Stage 3: Confirmed Success Screen */}
        {stage === "confirmed" && (
          <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center text-white mb-4 shadow-[0_0_20px_rgba(34,197,94,0.4)] animate-bounce">
              <Check className="h-6 w-6" />
            </div>
            
            <h3 className="text-base font-black text-white uppercase tracking-wider text-shadow-glow">Booking Confirmed!</h3>
            <p className="text-[11px] text-white/50 mt-1 max-w-xs px-2 leading-relaxed">
              Your pass is linked to your identity. Scan the digital QR pass at the entrance gate.
            </p>

            {/* Graphic Ticket Card */}
            <div className="w-full mt-5 mb-5 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col relative">
              <div className="p-3 bg-white/5 border-b border-dashed border-white/10 flex justify-between items-center text-[10px] font-black text-white/40 uppercase tracking-widest">
                <span>HappniX Pass</span>
                <span className="text-[var(--brand-3)]">HNX-{Math.floor(Math.random() * 900000 + 100000)}</span>
              </div>
              
              <div className="p-4 flex flex-col text-left gap-1">
                <h4 className="text-xs font-black text-white truncate">{eventTitle}</h4>
                <p className="text-[9px] text-[var(--brand-2)] font-black uppercase mt-1 tracking-wider">{categoryLabel}</p>
                
                <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
                  <div>
                    <span className="text-white/30 block uppercase tracking-wider text-[8px]">Total paid</span>
                    <span className="font-bold text-white">{isFree ? "FREE" : `₹${total}`}</span>
                  </div>
                  <div>
                    <span className="text-white/30 block uppercase tracking-wider text-[8px]">Allocation</span>
                    <span className="font-bold text-white">1x Pass</span>
                  </div>
                </div>
              </div>

              <div className="absolute top-[32px] -left-2 h-4 w-4 rounded-full bg-[#050508] border-r border-white/10" />
              <div className="absolute top-[32px] -right-2 h-4 w-4 rounded-full bg-[#050508] border-l border-white/10" />
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white cursor-pointer active:scale-95 transition-all"
            >
              Done & Close
            </button>
          </div>
        )}

        {/* Stage 4: Error Screen */}
        {stage === "error" && (
          <div className="flex flex-col items-center text-center animate-in zoom-in-95 duration-300 py-6">
            <div className="h-12 w-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
              <X className="h-6 w-6" />
            </div>
            
            <h3 className="text-base font-black text-white uppercase tracking-wider">Booking Failed</h3>
            <p className="text-[11px] text-white/50 mt-1.5 max-w-xs px-2 leading-relaxed">
              {errorMsg}
            </p>

            <div className="flex gap-3 mt-5 w-full">
              <button
                onClick={() => { setStage("checkout"); setErrorMsg(""); }}
                className="flex-1 py-3 rounded-xl bg-brand-gradient text-white text-xs font-black shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white cursor-pointer active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
