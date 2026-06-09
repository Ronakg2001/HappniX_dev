"use client";

import React from "react";
import { Button } from "./button";

export interface ProfileStatProps {
  label: string;
  value: number;
  onClick?: () => void;
}

export function ProfileStat({ label, value, onClick }: ProfileStatProps) {
  const content = (
    <>
      <span className="text-xl font-black text-foreground leading-none">
        {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
      </span>
      <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-0.5">
        {label}
      </span>
    </>
  );

  if (onClick) {
    return (
      <Button
        variant="ghost"
        onClick={onClick}
        className="flex flex-col items-center h-auto px-4 py-2 rounded-lg transition-all hover:bg-foreground/8 hover:text-current active:scale-95"
      >
        {content}
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center px-4 py-2 rounded-lg cursor-default">
      {content}
    </div>
  );
}
