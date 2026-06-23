"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "./Header";
import LocationBar from "@/components/location/LocationBar";
import LeftSidebar from "./LeftSidebar";
import BottomNav from "./BottomNav";
import { BookingModal, NotificationsModal } from "@/components/modals/HomeModals";
import { TicketType } from "@/types/booking";
import { LocationProvider, useLocation } from "@/lib/locationStore";
import { MOCK_EVENTS, MOCK_LIVE_STATES, MOCK_STATS, MOCK_BOOKED_TICKETS } from "@/constants/mockData";

interface LayoutContextType {
  openBooking: (title: string, price: string) => void;
  openCreateEvent: () => void;
  currentLocation: string;
  radius: number;
  bookedTickets: TicketType[];
  addTicket: (title: string, price: string) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}


function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { locationState } = useLocation();

  const currentLocation = locationState.address || "Set Location";
  const [radius, setRadius] = useState(10);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Tickets State
  const [bookedTickets, setBookedTickets] = useState<TicketType[]>([]);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRadius = localStorage.getItem("happnix_radius");
      if (savedRadius) setRadius(Number(savedRadius));

      const savedTickets = localStorage.getItem("happnix_booked_tickets");
      if (savedTickets) {
        const parsed = JSON.parse(savedTickets);
        if (parsed.length === 1 && parsed[0].id === "t1") {
          setBookedTickets(MOCK_BOOKED_TICKETS);
          localStorage.setItem("happnix_booked_tickets", JSON.stringify(MOCK_BOOKED_TICKETS));
        } else {
          setBookedTickets(parsed);
        }
      } else {
        setBookedTickets(MOCK_BOOKED_TICKETS);
        localStorage.setItem("happnix_booked_tickets", JSON.stringify(MOCK_BOOKED_TICKETS));
      }

      const savedCreated = localStorage.getItem("happnix_created_events_v4");
      if (!savedCreated) {
        localStorage.setItem("happnix_created_events_v4", JSON.stringify(MOCK_EVENTS));
      }

      const savedLive = localStorage.getItem("happnix_event_live_states_v4");
      if (!savedLive) {
        localStorage.setItem("happnix_event_live_states_v4", JSON.stringify(MOCK_LIVE_STATES));
      }

      const savedStats = localStorage.getItem("happnix_event_stats_v4");
      if (!savedStats) {
        localStorage.setItem("happnix_event_stats_v4", JSON.stringify(MOCK_STATS));
      }
    }
  }, []);

  const addTicket = (title: string, price: string) => {
    const newTicket: TicketType = {
      id: `t_${Date.now()}`,
      eventTitle: title,
      date: "Jun 06",
      time: "9:00 PM",
      seat: "General Entry"
    };
    const updated = [newTicket, ...bookedTickets];
    setBookedTickets(updated);
    localStorage.setItem("happnix_booked_tickets", JSON.stringify(updated));
  };

  // Modal States
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<{ title: string; price: string } | null>(null);

  const isAppRoute = pathname !== "/" && pathname !== "/signin" && pathname !== "/signup";

  // Auth guard: redirect unauthenticated users away from protected routes
  useEffect(() => {
    if (isAppRoute) {
      const token = localStorage.getItem("happnix_access_token");
      if (!token) {
        router.replace("/signin");
      }
    }
  }, [isAppRoute, router]);

  const openBooking = (title: string, price: string) => {
    setSelectedBooking({ title, price });
  };

  const openCreateEvent = () => {
    router.push("/my-events/create");
  };

  if (!isAppRoute) {
    return <>{children}</>;
  }

  return (
    <LayoutContext.Provider value={{
      openBooking, openCreateEvent, currentLocation, radius, bookedTickets, addTicket,
    }}>
      <div className="min-h-screen flex flex-col relative bg-background text-foreground home-feed">
        {/* Background gradients/glow effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--brand-1)]/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--brand-3)]/10 blur-[120px] animate-pulse" style={{ animationDuration: '12s' }} />
        </div>

        {/* Top Header */}
        <Header
          currentLocation={currentLocation}
          onLocationClick={() => setIsLocationModalOpen(true)}
          onNotificationsClick={() => setIsNotificationsOpen(true)}
        />

        <LocationBar
          isModalOpen={isLocationModalOpen}
          setIsModalOpen={setIsLocationModalOpen}
        />

        {/* Layout Grid */}
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 md:pb-6 w-full flex gap-6 relative z-10">
          <LeftSidebar
            onCreateClick={openCreateEvent}
            onNotificationsClick={() => setIsNotificationsOpen(true)}
            onMessagesClick={() => router.push("/messages")}
          />
          <div className="flex-1 min-w-0 flex gap-6">
            {children}
          </div>
        </div>

        <BottomNav onCreateClick={openCreateEvent} />

        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
        />

        {selectedBooking && (
          <BookingModal
            isOpen={!!selectedBooking}
            onClose={() => setSelectedBooking(null)}
            eventTitle={selectedBooking.title}
            price={selectedBooking.price}
          />
        )}
      </div>
    </LayoutContext.Provider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocationProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </LocationProvider>
  );
}
