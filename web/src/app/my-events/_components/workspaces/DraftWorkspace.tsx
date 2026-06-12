"use client";

import React from "react";
import { CreatedEventType } from "@/types/event";
import { EventBuilder } from "../wizard/EventBuilder";

export function DraftWorkspace({
  ev,
  onUpdate,
  onPublished,
}: {
  ev: CreatedEventType;
  onUpdate: (p: Partial<CreatedEventType>) => void;
  onPublished?: () => void;
}) {
  return (
    <EventBuilder
      ev={ev}
      onUpdate={onUpdate}
      onPublish={onPublished ?? (() => {})}
    />
  );
}

