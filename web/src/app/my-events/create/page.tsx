"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLayout } from "@/components/layout/AppLayout";
import { EventBuilder } from "../_components/wizard/EventBuilder";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  
  const { createdEvents, addCreatedEvent, updateCreatedEvent } = useLayout();
  
  // Find the event if id is present
  const event = id ? createdEvents.find((e) => e.id === id) : null;

  // Auto-initialize draft event on mount if no ID is provided
  useEffect(() => {
    if (!id) {
      const untouchedDraft = createdEvents.find(
        (e) =>
          e.status === "Draft" &&
          e.title === "Untitled Event" &&
          !e.description?.trim() &&
          !e.location.address?.trim()
      );
      if (untouchedDraft) {
        router.replace(`/my-events/create?id=${untouchedDraft.id}`);
      } else {
        const newId = addCreatedEvent("Untitled Event", "Party", "");
        router.replace(`/my-events/create?id=${newId}`);
      }
    }
  }, [id, createdEvents, addCreatedEvent, router]);

  // Loading state during auto-initialization
  if (!id) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh] select-none animate-in fade-in duration-200">
        <Loader2 className="h-8 w-8 text-[var(--brand-1)] animate-spin mb-4" />
        <h3 className="text-xs font-black text-white uppercase tracking-wider">Creating Event Draft...</h3>
        <p className="text-[10px] text-white/40 mt-1.5">Setting up your live preview workspace.</p>
      </div>
    );
  }

  // If editing an existing draft
  if (!event) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <h3 className="text-sm font-black text-white uppercase tracking-wider">Draft Event Not Found</h3>
        <p className="text-xs text-white/40 mt-2">The event draft may have been published or deleted.</p>
        <button
          onClick={() => router.push("/my-events")}
          className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-6 select-none min-w-0 w-full animate-in fade-in duration-300">
      <EventBuilder
        ev={event}
        onUpdate={(patch) => updateCreatedEvent(event.id, patch)}
        onPublish={() => router.push("/my-events")}
      />
    </div>
  );
}
