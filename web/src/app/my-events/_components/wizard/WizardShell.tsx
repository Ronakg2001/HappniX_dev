"use client";
import React from "react";
import { ChevronLeft, ChevronRight, Save, Rocket } from "lucide-react";

export const STEP_LABELS = [
  { label: "Basic Details", desc: "Name, dates, location, highlights" },
  { label: "Event Details", desc: "Services, artists, FAQs, T&C" },
  { label: "Ticketing", desc: "Capacity, pricing, tiers" },
  { label: "Preview", desc: "Review before publishing" },
];
interface WizardShellProps {
  step: number; // 1–4
  onBack: () => void;
  onNext: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onStepClick?: (step: number) => void;
  saving?: boolean;
  children: React.ReactNode;
  stepErrors?: string[];
}

export function WizardShell({
  step,
  onBack,
  onNext,
  onSaveDraft,
  onPublish,
  onStepClick,
  saving,
  children,
  stepErrors = [],
}: WizardShellProps) {
  const isLast = step === 4;

  return (
    <div className="flex flex-col gap-0">
      {/* Step indicator */}
      <div className="flex items-start gap-0 mb-6 overflow-x-auto scrollbar-none">
        {STEP_LABELS.map((s, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === step;
          const isDone = stepNum < step;
          return (
            <div key={i} className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => onStepClick?.(stepNum)}
                className={`flex flex-col items-center cursor-pointer transition-all hover:opacity-80 outline-none ${i > 0 ? "pl-4" : ""}`}
              >
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                  isDone
                    ? "bg-[var(--brand-1)] text-white"
                    : isActive
                    ? "bg-[var(--brand-1)]/20 border-2 border-[var(--brand-1)] text-[var(--brand-1)]"
                    : "bg-white/5 border border-white/10 text-white/30"
                }`}>
                  {isDone ? "✓" : stepNum}
                </div>
                <p className={`text-[9px] font-black mt-1 uppercase tracking-wider whitespace-nowrap ${
                  isActive ? "text-[var(--brand-1)]" : isDone ? "text-white/60" : "text-white/25"
                }`}>
                  {s.label}
                </p>
              </button>
              {i < STEP_LABELS.length - 1 && (
                <div className={`h-px w-8 mx-2 mt-[-8px] transition-colors ${isDone ? "bg-[var(--brand-1)]/50" : "bg-white/10"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step title */}
      <div className="mb-6">
        <p className="text-[9px] font-black text-[var(--brand-1)] uppercase tracking-widest">Step {step} of 4</p>
        <h2 className="text-lg font-black text-white mt-0.5">{STEP_LABELS[step - 1].label}</h2>
        <p className="text-xs text-white/40 mt-0.5">{STEP_LABELS[step - 1].desc}</p>
      </div>

      {/* Step content */}
      <div className="flex-1">{children}</div>

      {/* Step-level errors */}
      {stepErrors.length > 0 && (
        <div className="mt-5 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          {stepErrors.map((e, i) => (
            <p key={i} className="text-[10px] text-red-400">• {e}</p>
          ))}
        </div>
      )}

      {/* Navigation bar */}
      <div className="flex items-center gap-3 mt-7 pt-5 border-t border-white/5">
        <button
          type="button"
          onClick={onBack}
          disabled={step === 1}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white/50 hover:text-white border border-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>

        <button
          type="button"
          onClick={onSaveDraft}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? "Saving…" : "Save Draft"}
        </button>

        <div className="ml-auto">
          {isLast ? (
            <button
              type="button"
              onClick={onPublish}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-black shadow-glow hover:scale-[1.02] transition-all uppercase tracking-wider"
            >
              <Rocket className="h-3.5 w-3.5" /> Publish Event
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-black shadow-glow hover:scale-[1.02] transition-all"
            >
              Continue <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
