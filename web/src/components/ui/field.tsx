import * as React from "react";

export interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-white/60 uppercase tracking-widest">{label}</label>
      {children}
      {error && <p className="text-[12px] text-[#FF4FD8]">{error}</p>}
      {hint && <p className="text-[11px] text-white/35">{hint}</p>}
    </div>
  );
}
