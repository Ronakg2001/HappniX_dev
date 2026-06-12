"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Header from "./Header";
import LocationBar from "@/components/location/LocationBar";
import LeftSidebar from "./LeftSidebar";
import BottomNav from "./BottomNav";
import {
  BookingModal,
  NotificationsModal
} from "@/components/modals/HomeModals";

import { TicketType, AttendeeType, EventLiveState, EventStats } from "@/types/booking";
import {
  CreatedEventType,
  TicketTierType,
  PromoCodeType,
  FAQType,
} from "@/types/event";

interface LayoutContextType {
  openBooking: (title: string, price: string) => void;
  openCreateEvent: () => void;
  currentLocation: string;
  radius: number;
  bookedTickets: TicketType[];
  addTicket: (title: string, price: string) => void;
  createdEvents: CreatedEventType[];
  eventLiveStates: Record<string, EventLiveState>;
  eventStats: Record<string, EventStats>;
  addCreatedEvent: (title: string, category: string, price: string) => string;
  updateCreatedEvent: (id: string, patch: Partial<CreatedEventType>) => void;
  updateEventLiveState: (id: string, patch: Partial<EventLiveState>) => void;
  updateEventStats: (id: string, patch: Partial<EventStats>) => void;
  duplicateCreatedEvent: (id: string) => void;
  // For post-create redirect
  pendingActiveEventId: string | null;
  clearPendingActiveEventId: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}

function withTierDefaults(t: Omit<TicketTierType, "entryType"|"flexibleSeats"|"promoText"> & Partial<Pick<TicketTierType,"entryType"|"flexibleSeats"|"promoText">>): TicketTierType {
  return { entryType: "Regular", flexibleSeats: false, promoText: "", ...t };
}

import { MOCK_EVENTS, MOCK_LIVE_STATES, MOCK_STATS, MOCK_BOOKED_TICKETS } from "@/constants/mockData";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Location States
  const [currentLocation, setCurrentLocation] = useState("Jaipur");
  const [radius, setRadius] = useState(10);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Tickets State
  const [bookedTickets, setBookedTickets] = useState<TicketType[]>([]);

  // Created Events State
  const [createdEvents, setCreatedEvents] = useState<CreatedEventType[]>([]);

  // Live States & Stats States
  const [eventLiveStates, setEventLiveStates] = useState<Record<string, EventLiveState>>({});
  const [eventStats, setEventStats] = useState<Record<string, EventStats>>({});

  // Post-create redirect state
  const [pendingActiveEventId, setPendingActiveEventId] = useState<string | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLoc = localStorage.getItem("happnix_location");
      if (savedLoc) setCurrentLocation(savedLoc);

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
      if (savedCreated) {
        const parsed = JSON.parse(savedCreated) as CreatedEventType[];
        let hasSeenUntitledDraft = false;
        const cleaned = parsed.filter((ev) => {
          if (ev.status === "Draft" && ev.title === "Untitled Event" && !ev.description?.trim() && !ev.location.address?.trim()) {
            if (hasSeenUntitledDraft) return false;
            hasSeenUntitledDraft = true;
          }
          return true;
        });
        setCreatedEvents(cleaned);
        if (cleaned.length !== parsed.length) {
          localStorage.setItem("happnix_created_events_v4", JSON.stringify(cleaned));
        }
      } else {
        setCreatedEvents(MOCK_EVENTS);
        localStorage.setItem("happnix_created_events_v4", JSON.stringify(MOCK_EVENTS));
      }

      const savedLive = localStorage.getItem("happnix_event_live_states_v4");
      if (savedLive) {
        setEventLiveStates(JSON.parse(savedLive));
      } else {
        setEventLiveStates(MOCK_LIVE_STATES);
        localStorage.setItem("happnix_event_live_states_v4", JSON.stringify(MOCK_LIVE_STATES));
      }

      const savedStats = localStorage.getItem("happnix_event_stats_v4");
      if (savedStats) {
        setEventStats(JSON.parse(savedStats));
      } else {
        setEventStats(MOCK_STATS);
        localStorage.setItem("happnix_event_stats_v4", JSON.stringify(MOCK_STATS));
      }
    }
  }, []);

  const handleLocationChange = (loc: string) => {
    setCurrentLocation(loc);
    localStorage.setItem("happnix_location", loc);
  };

  const handleRadiusChange = (rad: number) => {
    setRadius(rad);
    localStorage.setItem("happnix_radius", String(rad));
  };

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

  const addCreatedEvent = (title: string, category: string, price: string): string => {
    const newId = `c_${Date.now()}`;
    const numPrice = price ? parseInt(price) : 0;
    const newEvent: CreatedEventType = {
      id: newId,
      status: "Draft",
      title,
      category,
      description: "",
      bannerUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80",
      ageGroup: "18+",
      tags: [],
      highlights: [],
      highlightText: "",
      services: [],
      dresscode: {
        enabled: false,
        style: "",
      },
      artists: [],
      schedule: {
        startDate: "",
        endDate: "",
        startTime: "20:00",
        endTime: "23:00",
      },
      location: {
        venue: "Venue TBD",
        address: "",
        lat: null,
        lng: null,
      },
      ticketing: {
        mode: numPrice > 0 ? "paid" : "free",
        capacity: 100,
        capacityFlex: false,
        tiers: [
          withTierDefaults({ id: "t1", name: "General Entry", price: numPrice, inventory: 100, sold: 0, paused: false }),
        ],
        promoCodes: [],
        price: price ? `₹${price}` : "Free Entry",
      },
      policies: {
        termsAndConditions: "",
        privacyPolicy: "",
        faqs: [],
      },
    };

    const newLive: EventLiveState = {
      eventId: newId,
      registrationOpen: false,
      isPublic: false,
      attendees: [],
      sessions: [],
      speakers: [],
      announcements: [],
      media: [],
    };

    const newStats: EventStats = {
      eventId: newId,
      revenue: 0,
      views: 0,
      hype: "0 Hype",
      feedback: [],
    };

    const updatedEvents = [newEvent, ...createdEvents];
    setCreatedEvents(updatedEvents);
    localStorage.setItem("happnix_created_events_v4", JSON.stringify(updatedEvents));

    const updatedLive = { ...eventLiveStates, [newId]: newLive };
    setEventLiveStates(updatedLive);
    localStorage.setItem("happnix_event_live_states_v4", JSON.stringify(updatedLive));

    const updatedStats = { ...eventStats, [newId]: newStats };
    setEventStats(updatedStats);
    localStorage.setItem("happnix_event_stats_v4", JSON.stringify(updatedStats));

    setPendingActiveEventId(newId);
    return newId;
  };

  const updateCreatedEvent = (id: string, patch: Partial<CreatedEventType>) => {
    const updated = createdEvents.map((ev) =>
      ev.id === id ? { ...ev, ...patch } : ev
    );
    setCreatedEvents(updated);
    localStorage.setItem("happnix_created_events_v4", JSON.stringify(updated));
  };

  const updateEventLiveState = (id: string, patch: Partial<EventLiveState>) => {
    const current = eventLiveStates[id] || {
      eventId: id,
      registrationOpen: false,
      isPublic: false,
      attendees: [],
      sessions: [],
      speakers: [],
      announcements: [],
      media: [],
    };
    const updated = { ...eventLiveStates, [id]: { ...current, ...patch } };
    setEventLiveStates(updated);
    localStorage.setItem("happnix_event_live_states_v4", JSON.stringify(updated));
  };

  const updateEventStats = (id: string, patch: Partial<EventStats>) => {
    const current = eventStats[id] || {
      eventId: id,
      revenue: 0,
      views: 0,
      hype: "0 Hype",
      feedback: [],
    };
    const updated = { ...eventStats, [id]: { ...current, ...patch } };
    setEventStats(updated);
    localStorage.setItem("happnix_event_stats_v4", JSON.stringify(updated));
  };

  const duplicateCreatedEvent = (id: string) => {
    const original = createdEvents.find((ev) => ev.id === id);
    if (!original) return;
    const newId = `c_${Date.now()}`;
    const clone: CreatedEventType = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
      status: "Draft",
    };

    const origLive = eventLiveStates[id] || {
      eventId: id,
      registrationOpen: false,
      isPublic: false,
      attendees: [],
      sessions: [],
      speakers: [],
      announcements: [],
      media: [],
    };
    const cloneLive: EventLiveState = {
      ...origLive,
      eventId: newId,
      attendees: [],
      announcements: [],
    };

    const origStats = eventStats[id] || {
      eventId: id,
      revenue: 0,
      views: 0,
      hype: "0 Hype",
      feedback: [],
    };
    const cloneStats: EventStats = {
      ...origStats,
      eventId: newId,
      revenue: 0,
      views: 0,
      hype: "0 Hype",
      feedback: [],
    };

    const updatedEvents = [clone, ...createdEvents];
    setCreatedEvents(updatedEvents);
    localStorage.setItem("happnix_created_events_v4", JSON.stringify(updatedEvents));

    const updatedLive = { ...eventLiveStates, [newId]: cloneLive };
    setEventLiveStates(updatedLive);
    localStorage.setItem("happnix_event_live_states_v4", JSON.stringify(updatedLive));

    const updatedStats = { ...eventStats, [newId]: cloneStats };
    setEventStats(updatedStats);
    localStorage.setItem("happnix_event_stats_v4", JSON.stringify(updatedStats));
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

  const clearPendingActiveEventId = () => setPendingActiveEventId(null);

  if (!isAppRoute) {
    return <>{children}</>;
  }

  return (
    <LayoutContext.Provider value={{
      openBooking, openCreateEvent, currentLocation, radius, bookedTickets, addTicket,
      createdEvents, eventLiveStates, eventStats, addCreatedEvent, updateCreatedEvent,
      updateEventLiveState, updateEventStats, duplicateCreatedEvent,
      pendingActiveEventId, clearPendingActiveEventId,
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

        {/* Location Bar */}
        <LocationBar
          currentLocation={currentLocation}
          radius={radius}
          onLocationChange={handleLocationChange}
          onRadiusChange={handleRadiusChange}
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
