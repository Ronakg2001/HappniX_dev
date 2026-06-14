"use client";

import React from "react";
import { ArrowLeft, MapPin, Calendar, Clock } from "lucide-react";
import { CreatedEventType } from "@/types/event";
import { STATUS_CONFIG } from "./constants";
import { Button } from "@/components/ui/button";

import { UpcomingWorkspace } from "./workspaces/UpcomingWorkspace";
import { LiveWorkspace } from "./workspaces/LiveWorkspace";
import { CompletedWorkspace } from "./workspaces/CompletedWorkspace";
import { ArchivedWorkspace } from "./workspaces/ArchivedWorkspace";

export function EventWorkspace({
  ev,
  onBack,
  onUpdate,
  onDuplicate,
}: {
  ev: CreatedEventType;
  onBack: () => void;
  onUpdate: (p: Partial<CreatedEventType>) => void;
  onDuplicate: () => void;
}) {
  const cfg = STATUS_CONFIG[ev.status];
  const StatusIcon = cfg.icon;

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-white/40 hover:text-white text-xs font-bold cursor-pointer w-fit transition-colors group px-0 hover:bg-transparent"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> Back to All Events
        </Button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border ${cfg.workspaceBadge}`}>
                {ev.status === "Live" && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} animate-pulse`} />}
                <StatusIcon className="h-2.5 w-2.5" />
                {ev.status}
              </span>
              <span className="text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/40">
                {ev.category}
              </span>
            </div>
            <h2 className="text-lg font-black text-white uppercase tracking-wide leading-tight">{ev.title}</h2>
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-white/40 font-bold flex-wrap">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{ev.location.venue}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{ev.schedule.startDate}</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ev.schedule.startTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stage-specific workspace */}

      {ev.status === "Upcoming"  && <UpcomingWorkspace  ev={ev} onUpdate={onUpdate} />}
      {ev.status === "Live"      && <LiveWorkspace      ev={ev} onUpdate={onUpdate} />}
      {ev.status === "Completed" && <CompletedWorkspace ev={ev} onUpdate={onUpdate} />}
      {ev.status === "Archived"  && <ArchivedWorkspace  ev={ev} onUpdate={onUpdate} onDuplicate={onDuplicate} />}
    </div>
  );
}
