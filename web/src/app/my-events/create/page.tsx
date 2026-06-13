"use client";

import React, { useEffect,useState,  Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMyEvents } from "../layout";
import { EventBuilder } from "../_components/wizard/EventBuilder";
import { ArrowLeft, Loader2 } from "lucide-react";
import { CreatedEventType } from "@/types/event";
import { EventLiveState, EventStats } from "@/types/booking";
import { Button } from "@/components/ui/button";

function CreateEventContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  
  const { 
    createdEvents, 
    setCreatedEvents, 
    updateCreatedEvent, 
    setEventLiveStates, 
    setEventStats,
    initialBlankEvent
  } = useMyEvents();

  const [localEvent, setLocalEvent] = useState<CreatedEventType | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize event state
  useEffect(() => {
    if (id) {
      const existing = createdEvents.find((e) => e.id === id);
      if (existing) {
        setLocalEvent(existing);
      } else {
        setLocalEvent(null);
      }
      setLoading(false);
    } else {
      // Create a temporary local event object with a unique ID, but do not save it globally yet
      setLocalEvent(initialBlankEvent(`c_${Date.now()}`));
      setLoading(false);
    }
  }, [id, createdEvents]);

  const addCreatedEvent = (newEvent: CreatedEventType) => {
    const numPrice = newEvent.ticketing.price ? parseInt(newEvent.ticketing.price.replace(/[^\d]/g, "")) || 0 : 0;
    
    const newLive: EventLiveState = {
      eventId: newEvent.id,
      registrationOpen: false,
      isPublic: false,
      attendees: [],
      sessions: [],
      speakers: [],
      announcements: [],
      media: [],
    };

    const newStats: EventStats = {
      eventId: newEvent.id,
      revenue: 0,
      views: 0,
      hype: "0 Hype",
      feedback: [],
    };

    // Save to provider state and localStorage
    setCreatedEvents((prev) => {
      const updatedEvents = [newEvent, ...prev];
      localStorage.setItem("happnix_created_events_v4", JSON.stringify(updatedEvents));
      return updatedEvents;
    });

    setEventLiveStates((prev) => {
      const updatedLive = { ...prev, [newEvent.id]: newLive };
      localStorage.setItem("happnix_event_live_states_v4", JSON.stringify(updatedLive));
      return updatedLive;
    });

    setEventStats((prev) => {
      const updatedStats = { ...prev, [newEvent.id]: newStats };
      localStorage.setItem("happnix_event_stats_v4", JSON.stringify(updatedStats));
      return updatedStats;
    });
  };

  const handleUpdate = (updatedForm: Partial<CreatedEventType>) => {
    if (!localEvent) return;

    if (id) {
      // Already persisted draft
      updateCreatedEvent(localEvent.id, updatedForm);
    } else {
      // First save draft action
      const newEvent = { ...localEvent, ...updatedForm } as CreatedEventType;
      addCreatedEvent(newEvent);
      // Redirect URL silently to include the draft ID
      router.replace(`/my-events/create?id=${newEvent.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh] select-none animate-in fade-in duration-200">
        <Loader2 className="h-8 w-8 text-[var(--brand-1)] animate-spin mb-4" />
        <h3 className="text-xs font-black text-white uppercase tracking-wider">Loading Workspace...</h3>
      </div>
    );
  }

  if (!localEvent) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <h3 className="text-sm font-black text-white uppercase tracking-wider">Draft Event Not Found</h3>
        <p className="text-xs text-white/40 mt-2">The event draft may have been published or deleted.</p>
        <Button
          onClick={() => router.push("/my-events")}
          variant="outline"
          className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 select-none min-w-0 w-full animate-in fade-in duration-300">
      <EventBuilder
        ev={localEvent}
        onUpdate={handleUpdate}
        onPublish={() => router.push("/my-events")}
      />
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 text-[var(--brand-1)] animate-spin" />
        </div>
      }
    >
      <CreateEventContent />
    </Suspense>
  );
}
