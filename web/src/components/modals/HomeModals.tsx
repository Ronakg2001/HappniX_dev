"use client";

import React, { useState } from "react";
import { X, Bell, UserPlus, Heart, Sparkles, MapPin, Calendar, Clock, Ticket, Check, ShieldCheck } from "lucide-react";

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
        <button className="w-full py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-glow hover:scale-102 transition-all">
          View Full Profile
        </button>
      </div>
    </div>
  );
}

// --- QUICK EVENT PREVIEW ---
export function EventPreviewModal({ isOpen, onClose, eventTitle }: { isOpen: boolean; onClose: () => void; eventTitle: string }) {
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
        <button className="w-full py-3 rounded-2xl bg-brand-gradient text-white text-xs font-bold shadow-glow hover:scale-102">
          View Event Details
        </button>
      </div>
    </div>
  );
}

// --- MINI BOOKING MODAL ---
export function BookingModal({ isOpen, onClose, eventTitle, price }: { isOpen: boolean; onClose: () => void; eventTitle: string; price: string }) {
  const [qty, setQty] = useState(1);
  const [booked, setBooked] = useState(false);

  if (!isOpen) return null;

  const basePrice = parseInt(price.replace(/[^\d]/g, "")) || 499;
  const subtotal = basePrice * qty;
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;

  const handleBooking = () => {
    setBooked(true);
    setTimeout(() => {
      setBooked(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-lg liquid-glass liquid-edge border border-border p-5 shadow-card animate-in zoom-in-95 duration-200">
        {booked ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-foreground">
            <div className="h-14 w-14 rounded-full bg-green-500 flex items-center justify-center text-white mb-4 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              <Check className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-black text-foreground mb-1">Booking Confirmed!</h3>
            <p className="text-xs text-foreground/60">Ticket QR is added to your profile widgets.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[9px] font-black tracking-widest text-[var(--brand-1)] uppercase">Quick Checkout</span>
                <h3 className="text-sm font-extrabold text-foreground leading-tight mt-0.5">{eventTitle}</h3>
              </div>
              <button onClick={onClose} className="p-1 rounded-full hover:bg-foreground/10 text-foreground/50 hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Ticket count select */}
            <div className="flex items-center justify-between py-2 px-3 rounded-2xl bg-foreground/5 border border-border mb-4">
              <span className="text-xs font-bold text-foreground/70">Number of tickets</span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => qty > 1 && setQty(qty - 1)}
                  className="h-8 w-8 rounded-xl bg-foreground/5 text-foreground flex items-center justify-center font-black hover:bg-foreground/10 active:scale-95 transition-all"
                >
                  -
                </button>
                <span className="text-sm font-black text-foreground">{qty}</span>
                <button 
                  onClick={() => setQty(qty + 1)}
                  className="h-8 w-8 rounded-xl bg-foreground/5 text-foreground flex items-center justify-center font-black hover:bg-foreground/10 active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price details */}
            <div className="space-y-2 mb-6 text-xs text-foreground/70">
              <div className="flex justify-between">
                <span>Tickets ({qty}x)</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Fee (5%)</span>
                <span>₹{serviceFee}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground text-sm border-t border-border pt-2 mt-2">
                <span>Total Amount</span>
                <span className="text-[var(--brand-1)]">₹{total}</span>
              </div>
            </div>

            <button
              onClick={handleBooking}
              className="w-full py-3.5 rounded-2xl bg-brand-gradient text-white text-xs font-black shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Pay & Confirm
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// --- CREATE EVENT MODAL ---
export function CreateEventModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Party");
  const [created, setCreated] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreated(true);
    setTimeout(() => {
      setCreated(false);
      onClose();
    }, 2000);
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Secret Rooftop Techno Set"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-foreground/5 border border-border text-sm text-foreground focus:outline-none focus:border-[var(--brand-1)] transition-all placeholder-foreground/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-[var(--brand-2)] transition-all"
                  >
                    <option value="Party" className="bg-white dark:bg-[#12121a] text-black dark:text-white">Party</option>
                    <option value="Gig" className="bg-white dark:bg-[#12121a] text-black dark:text-white">Gig</option>
                    <option value="Clubbing" className="bg-white dark:bg-[#12121a] text-black dark:text-white">Clubbing</option>
                    <option value="Social" className="bg-white dark:bg-[#12121a] text-black dark:text-white">Social</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/50 uppercase tracking-wider mb-1.5">Price (₹)</label>
                  <input
                    type="number"
                    placeholder="999"
                    className="w-full px-4 py-3 rounded-2xl bg-foreground/5 border border-border text-sm text-foreground focus:outline-none focus:border-[var(--brand-1)] transition-all placeholder-foreground/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-brand-gradient text-white text-xs font-bold shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all pt-3.5"
              >
                Launch Event 🚀
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
