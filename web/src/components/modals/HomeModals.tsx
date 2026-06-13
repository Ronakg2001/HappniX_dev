"use client";

import React, { useState } from "react";
import { X, Bell, UserPlus, Heart, Sparkles, MapPin, Calendar, Clock, Ticket, Check, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { PrimaryBtn } from "@/components/ui/button";

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
export function EventPreviewModal({ isOpen, onClose, eventTitle }: { isOpen: boolean; onClose: () => void; eventTitle: string }) {
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
            openBooking(eventTitle, "₹999");
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
export function BookingModal({ isOpen, onClose, eventTitle, price }: { isOpen: boolean; onClose: () => void; eventTitle: string; price: string }) {
  const { addTicket } = useLayout();

  // Booking States
  const [qty, setQty] = useState(1);
  const [category, setCategory] = useState<"general" | "vip" | "squad">("general");
  const [promoCode, setPromoCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [stage, setStage] = useState<"checkout" | "processing" | "confirmed">("checkout");
  const [processMsg, setProcessMsg] = useState("");

  if (!isOpen) return null;

  // Pricing calculations
  const rawBase = parseInt(price.replace(/[^\d]/g, "")) || 499;
  
  // Category multiplier
  let basePrice = rawBase;
  let categoryLabel = "General Admission";
  if (category === "vip") {
    basePrice = rawBase + 500;
    categoryLabel = "VIP Access Pass";
  } else if (category === "squad") {
    basePrice = Math.round(rawBase * 3.2); // Discounted package for multiple entries
    categoryLabel = "Squad Package (4 Entries)";
  }

  const subtotal = basePrice * qty;
  const discount = discountApplied ? Math.round(subtotal * 0.20) : 0; // 20% discount
  const serviceFee = Math.round((subtotal - discount) * 0.05);
  const total = subtotal - discount + serviceFee;

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

  const handleBooking = () => {
    setStage("processing");
    setProcessMsg("Securing spot with venue hosts...");
    
    setTimeout(() => {
      setProcessMsg("Generating secure gate QR keys...");
    }, 800);

    setTimeout(() => {
      setProcessMsg("Authorizing secure check-out transaction...");
    }, 1600);

    setTimeout(() => {
      addTicket(`${eventTitle} (${categoryLabel})`, `₹${total}`);
      setStage("confirmed");
    }, 2400);
  };

  const handleClose = () => {
    // Reset states
    setQty(1);
    setCategory("general");
    setPromoCode("");
    setDiscountApplied(false);
    setPromoError("");
    setStage("checkout");
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
                <span className="text-[9px] font-black tracking-widest text-[var(--brand-1)] uppercase text-shadow-glow">Squad Checkout</span>
                <h3 className="text-sm font-extrabold text-white leading-tight mt-0.5">{eventTitle}</h3>
              </div>
              <button onClick={handleClose} className="p-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white cursor-pointer active:scale-95 transition-all">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Ticket Categories/Tiers */}
            <div className="flex flex-col gap-2 mb-4">
              <label className="text-[10px] font-black uppercase tracking-wider text-white/40">Select Ticket Class</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "general", label: "General", desc: `₹${rawBase}` },
                  { id: "vip", label: "VIP Pass", desc: `₹${rawBase + 500}` },
                  { id: "squad", label: "Squad x4", desc: `₹${Math.round(rawBase * 3.2)}` }
                ].map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setCategory(tier.id as any)}
                    className={`p-2.5 rounded-full border flex flex-col items-center justify-center transition-all cursor-pointer outline-none focus:outline-none ${
                      category === tier.id
                        ? "bg-brand-gradient/20 border-[var(--brand-1)] text-white shadow-glow"
                        : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-xs font-bold leading-tight">{tier.label}</span>
                    <span className="text-[10px] text-white/40 mt-0.5">{tier.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between py-2.5 px-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
              <span className="text-xs font-bold text-white/70">Number of tickets</span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => qty > 1 && setQty(qty - 1)}
                  className="h-8 w-8 rounded-xl bg-white/5 text-white flex items-center justify-center font-black hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  -
                </button>
                <span className="text-sm font-black text-white">{qty}</span>
                <button 
                  onClick={() => setQty(qty + 1)}
                  className="h-8 w-8 rounded-xl bg-white/5 text-white flex items-center justify-center font-black hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Promo Code section */}
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

            {/* Dynamic Receipt Pricing Details */}
            <div className="space-y-2 mb-6 text-xs text-white/60 p-3.5 rounded-md bg-white/[0.02] border border-white/[0.04]">
              <div className="flex justify-between">
                <span>{categoryLabel} ({qty}x)</span>
                <span>₹{subtotal}</span>
              </div>
              {discountApplied && (
                <div className="flex justify-between text-green-400 font-medium">
                  <span>Promo Discount (-20%)</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Service processing fee (5%)</span>
                <span>₹{serviceFee}</span>
              </div>
              <div className="flex justify-between font-black text-white text-sm border-t border-white/[0.08] pt-2 mt-2">
                <span>Total Amount</span>
                <span className="text-brand-gradient text-shadow-glow font-black text-base">₹{total}</span>
              </div>
            </div>

            <button
              onClick={handleBooking}
              className="w-full py-3.5 rounded-2xl bg-brand-gradient text-white text-xs font-black shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all hover:shadow-[0_0_20px_rgba(255,79,216,0.4)] cursor-pointer"
            >
              Pay & Confirm Transaction
            </button>
          </>
        )}

        {/* Stage 2: Processing Payment Loader */}
        {stage === "processing" && (
          <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in duration-300">
            <div className="relative mb-5 flex items-center justify-center">
              <span className="absolute h-12 w-12 rounded-full border-4 border-white/5 border-t-[var(--brand-1)] animate-spin" />
              <Ticket className="h-6 w-6 text-white animate-pulse" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Securing Passes</h3>
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
              Your passes are linked to your profile identity. Scan the digital pass at the entrance gate.
            </p>

            {/* Graphic Ticket Card */}
            <div className="w-full mt-5 mb-5 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col relative">
              {/* Ticket header */}
              <div className="p-3 bg-white/5 border-b border-dashed border-white/10 flex justify-between items-center text-[10px] font-black text-white/40 uppercase tracking-widest">
                <span>HappniX Pass</span>
                <span className="text-[var(--brand-3)]">HNX-{Math.floor(Math.random() * 900000 + 100000)}</span>
              </div>
              
              {/* Ticket body */}
              <div className="p-4 flex flex-col text-left gap-1">
                <h4 className="text-xs font-black text-white truncate">{eventTitle}</h4>
                <p className="text-[9px] text-[var(--brand-2)] font-black uppercase mt-1 tracking-wider">{categoryLabel}</p>
                
                <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
                  <div>
                    <span className="text-white/30 block uppercase tracking-wider text-[8px]">Total paid</span>
                    <span className="font-bold text-white">₹{total}</span>
                  </div>
                  <div>
                    <span className="text-white/30 block uppercase tracking-wider text-[8px]">Qty booked</span>
                    <span className="font-bold text-white">{qty} passes</span>
                  </div>
                </div>
              </div>

              {/* Decorative Circle notches for ticket cut */}
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

      </div>
    </div>
  );
}

// --- CREATE EVENT MODAL ---
export function CreateEventModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { addCreatedEvent } = useLayout();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Party");
  const [price, setPrice] = useState("");
  const [created, setCreated] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCreatedEvent(title, category, price); // sets pendingActiveEventId internally
    setCreated(true);
    setTimeout(() => {
      setCreated(false);
      setTitle("");
      setPrice("");
      setCategory("Party");
      onClose();
      router.push("/my-events");
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-md rounded-lg liquid-glass liquid-edge border border-border p-5 sm:p-6 shadow-card animate-in zoom-in-95 duration-200">
        {created ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-14 w-14 rounded-full bg-brand-gradient flex items-center justify-center text-white mb-4 shadow-glow animate-pulse">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-black text-foreground mb-1">Event Created!</h3>
            <p className="text-xs text-foreground/60">Your event will show up on nearby feed searches shortly.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-[var(--brand-1)]" />
                Host a New Event
              </h3>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-foreground/10 text-foreground/50 hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label="Event Name">
                <Input
                  type="text"
                  required
                  placeholder="e.g. Secret Rooftop Techno Set"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Party" className="bg-[#09090b] text-white">Party</option>
                    <option value="Gig" className="bg-[#09090b] text-white">Gig</option>
                    <option value="Clubbing" className="bg-[#09090b] text-white">Clubbing</option>
                    <option value="Social" className="bg-[#09090b] text-white">Social</option>
                  </Select>
                </Field>
                <Field label="Price (₹)">
                  <Input
                    type="number"
                    placeholder="999"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </Field>
              </div>

              <PrimaryBtn type="submit" className="py-3">
                Launch Event 🚀
              </PrimaryBtn>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
