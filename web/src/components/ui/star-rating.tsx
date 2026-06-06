"use client";

import React from "react";
import { Star } from "lucide-react";

/**
 * Generic 5-star rating display.
 * Usage: <StarRating rating={4} />
 */
export function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= rating ? "text-amber-400 fill-amber-400" : "text-white/20"}`}
        />
      ))}
    </span>
  );
}
