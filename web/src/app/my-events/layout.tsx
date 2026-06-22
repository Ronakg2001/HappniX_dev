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
  deleteCreatedEvent: (id: string) => void;
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

/**
 * Transform a flat backend RDS event row into the nested CreatedEventType
 * shape that the frontend components expect.
 */
function transformBackendEvent(ev: any): CreatedEventType {
  // If it already has the frontend shape (e.g. from localStorage), return as-is
  if (ev.schedule && ev.location && ev.ticketing) {
    return ev as CreatedEventType;
  }

  // Safely parse JSON or Python-stringified dictionaries (from corrupted test data)
  let metadata: any = {};
  let policies: any = {};
  try {
    if (typeof ev.metadata === "string") {
      // Very basic cleanup to try and salvage Python strings like "{'artists': []}"
      const cleaned = ev.metadata.replace(/'/g, '"').replace(/False/g, 'false').replace(/True/g, 'true');
      metadata = JSON.parse(cleaned || "{}");
    } else {
      metadata = ev.metadata || {};
    }
  } catch (e) {
    console.warn("[HappniX] Failed to parse metadata:", ev.metadata);
  }

  try {
    if (typeof ev.policies === "string") {
      const cleaned = ev.policies.replace(/'/g, '"').replace(/False/g, 'false').replace(/True/g, 'true');
      policies = JSON.parse(cleaned || "{}");
    } else {
      policies = ev.policies || {};
    }
  } catch (e) {
    console.warn("[HappniX] Failed to parse policies:", ev.policies);
  }

  // Parse ISO datetime into date and time parts
  const parseDateTime = (iso: string | null) => {
    if (!iso) return { date: "", time: "" };
    try {
      const d = new Date(iso);
      const date = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const time = d.toTimeString().slice(0, 5);   // HH:MM
      return { date, time };
    } catch {
      return { date: "", time: "" };
    }
  };

  const start = parseDateTime(ev.startAt);
  const end = parseDateTime(ev.endAt);

  const statusMap: Record<string, CreatedEventType["status"]> = {
    "Draft": "Draft",
    "Published": "Upcoming",
    "SoldOut": "Live",
    "Cancelled": "Archived",
    "Completed": "Completed",
    "Suspended": "Archived",
  };

  let dynamicStatus = statusMap[ev.status] || "Draft";
  
  if (dynamicStatus === "Upcoming" || dynamicStatus === "Live" || dynamicStatus === "Completed") {
    const now = new Date();
    const startObj = ev.startAt ? new Date(ev.startAt) : null;
    const endObj = ev.endAt ? new Date(ev.endAt) : null;
    
    if (startObj && endObj) {
      if (now < startObj) {
        dynamicStatus = "Upcoming";
      } else if (now >= startObj && now <= endObj) {
        dynamicStatus = "Live";
      } else if (now > endObj) {
        dynamicStatus = "Completed";
      }
    }
  }

  const tags = Array.isArray(ev.tags)
    ? ev.tags
    : (typeof ev.tags === "string" ? ev.tags.replace(/[{}]/g, "").split(",").filter(Boolean) : []);

  return {
    id: ev.eventID || ev.id,
    status: dynamicStatus,
    title: ev.title || "",
    category: ev.eventCategory || ev.category || "General",
    description: ev.description || "",
    bannerUrl: ev.coverImageUrl || "",
    ageGroup: metadata.ageGroup || "18+",
    tags,
    highlights: metadata.highlights || [],
    highlightText: metadata.highlightText || "",
    services: metadata.services || [],
    dresscode: metadata.dresscode || { enabled: false, style: "" },
    artists: metadata.artists || [],
    schedule: {
      startDate: start.date,
      endDate: end.date,
      startTime: start.time || "20:00",
      endTime: end.time || "23:00",
    },
    location: {
      venue: ev.locationName || "Venue TBD",
      address: ev.locationAddress || "",
      lat: ev.latitude ? parseFloat(ev.latitude) : null,
      lng: ev.longitude ? parseFloat(ev.longitude) : null,
    },
    ticketing: {
      mode: (ev.ticketType === "Paid" ? "paid" : "free") as "free" | "paid" | "guestlist",
      capacity: ev.maxAttendees ? parseInt(ev.maxAttendees) : 100,
      capacityFlex: false,
      tiers: [
        withTierDefaults({ id: "t1", name: "General Entry", price: parseFloat(ev.basePrice || "0"), inventory: ev.maxAttendees ? parseInt(ev.maxAttendees) : 100, sold: 0, paused: false }),
      ],
      promoCodes: [],
      price: ev.ticketType === "Paid" ? `₹${ev.basePrice || "0"}` : "Free Entry",
    },
    policies: {
      termsAndConditions: policies.termsAndConditions || "",
      privacyPolicy: policies.privacyPolicy || "",
      faqs: policies.faqs || [],
    },
  };
}

export default function MyEventsLayout({ children }: { children: React.ReactNode }) {
  const [createdEvents, setCreatedEvents] = useState<CreatedEventType[]>([]);
  const [eventLiveStates, setEventLiveStates] = useState<Record<string, EventLiveState>>({});
  const [eventStats, setEventStats] = useState<Record<string, EventStats>>({});

  // Sync state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCreated = localStorage.getItem("happnix_created_events_v4");
      if (savedCreated) {
        try {
          const parsed = JSON.parse(savedCreated);
          // Always run through transform to handle any stale flat backend data
          const safe = parsed.map((ev: any) => transformBackendEvent(ev));
          setCreatedEvents(safe);
          localStorage.setItem("happnix_created_events_v4", JSON.stringify(safe));
        } catch {
          setCreatedEvents(MOCK_EVENTS);
          localStorage.setItem("happnix_created_events_v4", JSON.stringify(MOCK_EVENTS));
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
      
      // Fetch fresh events from backend via GET request
      apiClient.get("api/events")
        .then((res: any) => {
          console.log("[HappniX] Backend events response:", res);
          if (res?.success && Array.isArray(res?.events) && res.events.length > 0) {
            // Transform backend flat RDS rows into frontend CreatedEventType shape
            const transformed = res.events.map((ev: any) => transformBackendEvent(ev));
            console.log("[HappniX] Transformed events:", transformed);
            
            // Merge: backend events take priority, keep any local-only drafts
            setCreatedEvents((prev) => {
              const backendIds = new Set(transformed.map((e: CreatedEventType) => e.id));
              const localOnly = prev.filter((e) => !backendIds.has(e.id) && e.id.startsWith("c_"));
              const merged = [...transformed, ...localOnly];
              localStorage.setItem("happnix_created_events_v4", JSON.stringify(merged));
              return merged;
            });
          } else {
            console.log("[HappniX] No backend events found. Response:", res);
          }
        })
        .catch(err => console.error("[HappniX] Error fetching my events:", err));
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
          })
          .then((res: any) => {
            const backendEventId = res.data?.eventID || res.eventID;
            if (backendEventId && id.startsWith("c_")) {
              setCreatedEvents((curr) => {
                const updatedCurr = curr.map(e => e.id === id ? { ...e, id: backendEventId } : e);
                localStorage.setItem("happnix_created_events_v4", JSON.stringify(updatedCurr));
                return updatedCurr;
              });
            }
          })
          .catch(err => console.error("Event Sync Error:", err));
        });
      }
      
      return updated;
    });
  };

  const deleteCreatedEvent = (id: string) => {
    setCreatedEvents((prev) => {
      const updated = prev.filter((ev) => ev.id !== id);
      localStorage.setItem("happnix_created_events_v4", JSON.stringify(updated));
      return updated;
    });

    if (!id.startsWith("c_")) {
      apiClient.post("/api/events", {
        actionItem: "DeleteEvent",
        eventID: id
      }).catch(err => console.error("Event Delete Error:", err));
    }
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
        deleteCreatedEvent,
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
