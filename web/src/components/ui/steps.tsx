import * as React from "react";

export interface StepsProps {
  current: number;
  steps?: string[];
}

export function Steps({ current, steps = ["Sign Up", "Your Details", "Profile"] }: StepsProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className={`flex items-center gap-2 ${i <= current ? "opacity-100" : "opacity-30"}`}>
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
              i < current ? "bg-brand-gradient text-white" :
              i === current ? "bg-brand-gradient shadow-glow text-white" :
              "border border-white/20 text-white/40"
            }`}>
              {i < current ? "✓" : i + 1}
            </div>
            <span className={`text-[12px] font-medium ${i === current ? "text-white" : "text-white/40"}`}>{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-[1px] w-8 mx-3 transition-all duration-300 ${i < current ? "bg-brand-gradient" : "bg-white/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
