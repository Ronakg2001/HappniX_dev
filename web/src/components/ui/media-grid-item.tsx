"use client";

import React, { useState } from "react";
import { Play, Ticket, Sparkles, Heart, MessageCircle } from "lucide-react";

export type MediaType = "photo" | "video" | "event";

export interface MediaItem {
  id: string;
  type: MediaType;
  gradient: string;
  caption: string;
  likes: number;
  comments: number;
}

export interface MediaGridItemProps {
  item: MediaItem;
  onClick: () => void;
}

export function MediaGridItem({ item, onClick }: MediaGridItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${hovered ? "scale-[1.02] shadow-glow" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`} />
      <div className="absolute inset-0 flex items-center justify-center">
        {item.type === "video" ? (
          <Play className="h-7 w-7 text-white/40" />
        ) : item.type === "event" ? (
          <Ticket className="h-7 w-7 text-white/40" />
        ) : (
          <Sparkles className="h-7 w-7 text-white/40" />
        )}
      </div>

      {/* Hover overlay */}
      <div className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5 transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-white text-xs font-bold">
            <Heart className="h-3.5 w-3.5 fill-white" /> {item.likes}
          </span>
          <span className="flex items-center gap-1 text-white text-xs font-bold">
            <MessageCircle className="h-3.5 w-3.5" /> {item.comments}
          </span>
        </div>
      </div>

      {/* Type badge */}
      {item.type !== "photo" && (
        <div className="absolute top-1.5 right-1.5 p-1 rounded bg-black/50">
          {item.type === "video" ? (
            <Play className="h-2.5 w-2.5 text-white" />
          ) : (
            <Ticket className="h-2.5 w-2.5 text-[var(--brand-4)]" />
          )}
        </div>
      )}
    </div>
  );
}
