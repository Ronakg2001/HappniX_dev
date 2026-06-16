"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CreatedEventType, TicketTierType } from "@/types/event";
import { EventLiveState, EventStats } from "@/types/booking";
import { MOCK_EVENTS, MOCK_LIVE_STATES, MOCK_STATS } from "@/constants/mockData";
import { apiClient, processEventMedia } from "@/lib/api";

interface MyEventsContextType {
  createdEvents: CreatedEventType[];
  eventLiveStates: Record<string, EventLiveState>;
  eventStats: Record<string, EventStats>;
  updateCreatedEvent: (id: string, patch: Partial<CreatedEventType>) => void;
  updateEventLiveState: (id: string, patch: Partial<EventLiveState>) => void;
  updateEventStats: (id: string, patch: Partial<EventStats>) => void;
  duplicateCreatedEvent: (id: string) => void;
  setCreatedEvents: React.Dispatch<React.SetStateAction<CreatedEventType[]>>;
  setEventLiveStates: React.Dispatch<React.SetStateAction<Record<string, EventLiveState>>>;
  setEventStats: React.Dispatch<React.SetStateAction<Record<string, EventStats>>>;
  withTierDefaults: (t: Omit<TicketTierType, "entryType" | "flexibleSeats" | "promoText"> & Partial<Pick<TicketTierType, "entryType" | "flexibleSeats" | "promoText">>) => TicketTierType;
  initialBlankEvent: (id: string) => CreatedEventType;
}

const MyEventsContext = createContext<MyEventsContextType | undefined>(undefined);

export function useMyEvents() {
  const context = useContext(MyEventsContext);
  if (!context) {
    throw new Error("useMyEvents must be used within a MyEventsProvider");
  }
  return context;
}

export function withTierDefaults(t: Omit<TicketTierType, "entryType" | "flexibleSeats" | "promoText"> & Partial<Pick<TicketTierType, "entryType" | "flexibleSeats" | "promoText">>): TicketTierType {
  return { entryType: "Regular", flexibleSeats: false, promoText: "", ...t };
}

export const initialBlankEvent = (id: string): CreatedEventType => ({
  id,
  status: "Draft",
  title: "",
  category: "Party",
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
    mode: "free",
    capacity: 100,
    capacityFlex: false,
    tiers: [
      withTierDefaults({ id: "t1", name: "General Entry", price: 0, inventory: 100, sold: 0, paused: false }),
    ],
    promoCodes: [],
    price: "Free Entry",
  },
  policies: {
    termsAndConditions: "",
    privacyPolicy: "",
    faqs: [],
  },
});

export default function MyEventsLayout({ children }: { children: React.ReactNode }) {
  const [createdEvents, setCreatedEvents] = useState<CreatedEventType[]>([]);
  const [eventLiveStates, setEventLiveStates] = useState<Record<string, EventLiveState>>({});
  const [eventStats, setEventStats] = useState<Record<string, EventStats>>({});

  // Sync state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCreated = localStorage.getItem("happnix_created_events_v4");
      if (savedCreated) {
        setCreatedEvents(JSON.parse(savedCreated));
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
      
      // Fetch fresh events from backend via GET request
      apiClient.get("api/events")
        .then((res: any) => {
          if (res.success && res.events && res.events.length > 0) {
            setCreatedEvents(res.events);
            localStorage.setItem("happnix_created_events_v4", JSON.stringify(res.events));
          }
        })
        .catch(err => console.error("Error fetching my events:", err));
    }
  }, []);

  const updateCreatedEvent = (id: string, patch: Partial<CreatedEventType>) => {
    setCreatedEvents((prev) => {
      const updated = prev.map((ev) => {
        if (ev.id === id) {
          return { ...ev, ...patch };
        }
        return ev;
      });
      
      const savedEvent = updated.find((ev) => ev.id === id);
      
      if (savedEvent) {
        localStorage.setItem("happnix_created_events_v4", JSON.stringify(updated));
        
        // Background sync to backend
        const actionItem = (savedEvent.status === "Upcoming" || savedEvent.status === "Live") 
          ? "PublishEvent" 
          : "CreateEventDraft";
          
        processEventMedia(savedEvent).then((processedEvent) => {
          apiClient.post("/api/events", {
            actionItem,
            eventData: processedEvent
          }).catch(err => console.error("Event Sync Error:", err));
        });
      }
      
      return updated;
    });
  };

  const updateEventLiveState = (id: string, patch: Partial<EventLiveState>) => {
    setEventLiveStates((prev) => {
      const current = prev[id] || {
        eventId: id,
        registrationOpen: false,
        isPublic: false,
        attendees: [],
        sessions: [],
        speakers: [],
        announcements: [],
        media: [],
      };
      const updated = { ...prev, [id]: { ...current, ...patch } };
      localStorage.setItem("happnix_event_live_states_v4", JSON.stringify(updated));
      return updated;
    });
  };

  const updateEventStats = (id: string, patch: Partial<EventStats>) => {
    setEventStats((prev) => {
      const current = prev[id] || {
        eventId: id,
        revenue: 0,
        views: 0,
        hype: "0 Hype",
        feedback: [],
      };
      const updated = { ...prev, [id]: { ...current, ...patch } };
      localStorage.setItem("happnix_event_stats_v4", JSON.stringify(updated));
      return updated;
    });
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

    setCreatedEvents((prev) => {
      const updated = [clone, ...prev];
      localStorage.setItem("happnix_created_events_v4", JSON.stringify(updated));
      return updated;
    });

    setEventLiveStates((prev) => {
      const updated = { ...prev, [newId]: cloneLive };
      localStorage.setItem("happnix_event_live_states_v4", JSON.stringify(updated));
      return updated;
    });

    setEventStats((prev) => {
      const updated = { ...prev, [newId]: cloneStats };
      localStorage.setItem("happnix_event_stats_v4", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <MyEventsContext.Provider
      value={{
        createdEvents,
        eventLiveStates,
        eventStats,
        updateCreatedEvent,
        updateEventLiveState,
        updateEventStats,
        duplicateCreatedEvent,
        setCreatedEvents,
        setEventLiveStates,
        setEventStats,
        withTierDefaults,
        initialBlankEvent,
      }}
    >
      {children}
    </MyEventsContext.Provider>
  );
}
