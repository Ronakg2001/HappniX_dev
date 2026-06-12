"use client";
import React from "react";
import { Plus, X } from "lucide-react";
import { PromoCodeType } from "@/types/event";

interface PromoCodeBuilderProps {
  value: PromoCodeType[];
  onChange: (codes: PromoCodeType[]) => void;
  error?: string;
}

export function PromoCodeBuilder({ value, onChange, error }: PromoCodeBuilderProps) {
  const add = () => {
    onChange([...value, { id: `promo_${Date.now()}`, code: "", discount: 10, maxUses: 100 }]);
  };

  const remove = (id: string) => onChange(value.filter((p) => p.id !== id));

  const update = (id: string, field: keyof PromoCodeType, val: string | number) => {
    onChange(value.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
  };

  return (
    <div className="flex flex-col gap-2">
      {value.map((promo, idx) => (
        <div
          key={promo.id}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10"
        >
          <span className="text-[10px] font-black text-white/30 w-4 shrink-0">#{idx + 1}</span>

          <input
            type="text"
            value={promo.code}
            onChange={(e) => update(promo.id, "code", e.target.value.toUpperCase())}
            placeholder="CODE"
            className="w-28 bg-transparent text-[11px] font-mono font-bold text-white placeholder-white/20 outline-none border-r border-white/10 pr-2"
          />

          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={100}
              value={promo.discount}
              onChange={(e) => update(promo.id, "discount", Number(e.target.value))}
              className="w-12 bg-transparent text-[11px] text-white outline-none text-right"
            />
            <span className="text-[10px] text-white/40">% off</span>
          </div>

          <div className="flex items-center gap-1 ml-1 border-l border-white/10 pl-2">
            <input
              type="number"
              min={1}
              value={promo.maxUses}
              onChange={(e) => update(promo.id, "maxUses", Number(e.target.value))}
              className="w-14 bg-transparent text-[11px] text-white outline-none text-right"
            />
            <span className="text-[10px] text-white/40">uses</span>
          </div>

          <button
            type="button"
            onClick={() => remove(promo.id)}
            className="ml-auto p-1 text-white/20 hover:text-red-400 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-[11px] text-[var(--brand-1)] hover:opacity-80 transition-opacity self-start mt-1"
      >
        <Plus className="h-3 w-3" /> Add Promo Code
      </button>

      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
