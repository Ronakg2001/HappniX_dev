"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLayout } from "@/components/layout/AppLayout";
import { EventWorkspace } from "../_components/EventWorkspace";
import { ArrowLeft } from "lucide-react";

export default function EventDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const { createdEvents, updateCreatedEvent, duplicateCreatedEvent } = useLayout();

  const event = id ? createdEvents.find((e) => e.id === id) : null;

  if (!id || !event) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <h3 className="text-sm font-black text-white uppercase tracking-wider">Event Not Found</h3>
        <p className="text-xs text-white/40 mt-2">The event may have been deleted or archived.</p>
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
      <EventWorkspace
        ev={event}
        onBack={() => router.push("/my-events")}
        onUpdate={(patch) => updateCreatedEvent(event.id, patch)}
        onDuplicate={() => {
          duplicateCreatedEvent(event.id);
          router.push("/my-events");
        }}
      />
    </div>
  );
}
