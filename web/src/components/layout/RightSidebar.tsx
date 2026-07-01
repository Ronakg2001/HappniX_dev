"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket, TrendingUp, Sparkles, UserPlus, UserCheck, QrCode, LogOut } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useLayout } from "@/components/layout/AppLayout";

interface RightSidebarProps {
  onBookNow: (title: string, price: string, e?: React.MouseEvent, eventID?: string) => void;
}

export default function RightSidebar({ onBookNow }: RightSidebarProps) {
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [showQR, setShowQR] = useState<string | null>(null);
  const router = useRouter();
  const { bookedTickets } = useLayout();

  const handleLogout = async () => {
    try {
      // The interceptor in api.ts will catch this, clear localStorage, and cancel the request
      await apiClient.post("/api/home/logout", { actionItem: "Logout" });
    } catch (err) {
      // Axios cancel throws an error, which is expected
    }
    router.push("/signin");
  };

  const upcomingTickets = bookedTickets;

  const trendingEvents = [
    { id: "e1", title: "Club Utopia DJ Set", location: "C-Scheme, Jaipur", price: "₹999", distance: "2.4 km" },
    { id: "e2", title: "Electro Forest", location: "Mansarovar, Jaipur", price: "₹1,499", distance: "4.1 km" }
  ];

  const suggestedPeople = [
    { id: "p1", name: "Rohan Gupta", username: "rohang", mutuals: 12 },
    { id: "p2", name: "Ananya Sharma", username: "ananyas", mutuals: 5 }
  ];

  const handleFollow = (id: string) => {
    if (followedIds.includes(id)) {
      setFollowedIds(followedIds.filter(item => item !== id));
    } else {
      setFollowedIds([...followedIds, id]);
    }
  };

  return (
    <aside className="hidden xl:flex flex-col gap-6 w-[340px] shrink-0 sticky top-20 overflow-y-auto pr-2 pb-6 self-start scrollbar-thin">
      {/* Widget 1: Upcoming Tickets */}
      {upcomingTickets.length > 0 && (
        <div className="liquid-glass liquid-edge rounded-lg p-4 sm:p-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-foreground/50 mb-4 flex items-center gap-2">
            <Ticket className="h-4 w-4 text-[var(--brand-1)]" />
            Upcoming Tickets
          </h3>
          {upcomingTickets.map((t) => (
            <div key={t.id} className="relative rounded-md bg-foreground/10 border border-border p-3 flex flex-col gap-2 mb-1">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-foreground truncate leading-tight">{t.eventTitle}</h4>
                  <p className="text-[10px] text-foreground/40 mt-1">{t.date} at {t.time}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-[var(--brand-1)]/10 text-[var(--brand-1)] text-[9px] font-extrabold uppercase">
                    {t.seat}
                  </span>
                </div>
                <button 
                  onClick={() => setShowQR(showQR === t.id ? null : t.id)}
                  className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground/80 transition-all shrink-0"
                  title="View Ticket QR"
                >
                  <QrCode className="h-5 w-5 text-[var(--brand-3)]" />
                </button>
              </div>

              {/* Simulated QR Code Area */}
              {showQR === t.id && (
                <div className="flex flex-col items-center justify-center p-4 bg-white border border-border rounded-md mt-2 animate-in zoom-in-95 duration-200">
                  <div className="h-28 w-28 bg-black flex items-center justify-center font-bold text-xs text-white">
                    [ QR CODE ]
                  </div>
                  <p className="text-[10px] font-bold text-black mt-2">SCAN AT GATE</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Widget 2: Trending Events */}
      <div className="liquid-glass liquid-edge rounded-lg p-4 sm:p-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground/50 mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[var(--brand-2)]" />
          Trending Events Nearby
        </h3>
        <div className="flex flex-col gap-3">
          {trendingEvents.map((e) => (
            <div key={e.id} className="rounded-md bg-foreground/5 border border-border p-3 flex items-center justify-between gap-2 hover:bg-foreground/10 transition-all">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-foreground truncate leading-tight">{e.title}</h4>
                <p className="text-[10px] text-foreground/40 mt-0.5 truncate">{e.location} • {e.distance}</p>
                <p className="text-xs font-extrabold text-[var(--brand-1)] mt-1.5">{e.price}</p>
              </div>
              <button 
                onClick={() => onBookNow(e.title, e.price, undefined, e.id)}
                className="py-2 px-3 rounded-xl bg-brand-gradient text-white text-[11px] font-bold shrink-0 shadow-glow hover:scale-102 transition-transform"
              >
                Book
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Widget 3: Suggested People */}
      <div className="liquid-glass liquid-edge rounded-lg p-4 sm:p-5">
        <h3 className="text-xs font-black uppercase tracking-wider text-foreground/50 mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--brand-4)]" />
          Suggested People
        </h3>
        <div className="flex flex-col gap-3">
          {suggestedPeople.map((p) => {
            const isFollowing = followedIds.includes(p.id);

            return (
              <div key={p.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-brand-gradient flex items-center justify-center font-bold text-xs border border-white/10 shrink-0 text-white">
                    {p.name[0]}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground truncate">{p.name}</h4>
                    <p className="text-[10px] text-foreground/40 truncate">@{p.username} • {p.mutuals} mutuals</p>
                  </div>
                </div>

                <button
                  onClick={() => handleFollow(p.id)}
                  className={`p-1.5 rounded-lg transition-all ${
                    isFollowing 
                      ? "text-foreground/45 bg-foreground/5 border border-border" 
                      : "bg-[var(--brand-3)]/10 text-[var(--brand-3)] hover:bg-[var(--brand-3)]/20"
                  }`}
                  title={isFollowing ? "Unfollow" : "Follow"}
                >
                  {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Widget 4: Quick Actions */}
      <div className="liquid-glass liquid-edge rounded-lg p-2 sm:p-3 mt-auto">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
