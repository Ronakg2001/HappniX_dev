"use client";
import React from "react";
import { Plus, X } from "lucide-react";
import { PromoCodeType } from "@/types/event";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
          className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/15"
        >
          <span className="text-[10px] font-black text-white/30 w-4 shrink-0">#{idx + 1}</span>

          <Input
            type="text"
            value={promo.code}
            onChange={(e) => update(promo.id, "code", e.target.value.toUpperCase())}
            placeholder="CODE"
            className="w-28 text-[11px] font-mono font-bold text-center px-2 py-1 h-7 rounded-lg bg-[#12121a] border border-white/10"
          />

          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              min={1}
              max={100}
              value={promo.discount}
              onChange={(e) => update(promo.id, "discount", Number(e.target.value))}
              className="w-16 text-[11px] text-center px-2 py-1 h-7 rounded-lg bg-[#12121a] border border-white/10"
            />
            <span className="text-[10px] text-white/40 font-bold">% off</span>
          </div>

          <div className="flex items-center gap-1.5 ml-1 border-l border-white/10 pl-3">
            <Input
              type="number"
              min={1}
              value={promo.maxUses}
              onChange={(e) => update(promo.id, "maxUses", Number(e.target.value))}
              className="w-16 text-[11px] text-center px-2 py-1 h-7 rounded-lg bg-[#12121a] border border-white/10"
            />
            <span className="text-[10px] text-white/40 font-bold">uses</span>
          </div>

          <Button
            type="button"
            onClick={() => remove(promo.id)}
            variant="ghost"
            size="icon-xs"
            className="ml-auto text-white/20 hover:text-red-400 transition-colors h-7 w-7"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        onClick={add}
        variant="ghost"
        size="sm"
        className="flex items-center gap-1.5 text-[11px] text-[var(--brand-1)] hover:opacity-80 transition-opacity self-start mt-1 px-1 h-auto py-1"
      >
        <Plus className="h-3 w-3" /> Add Promo Code
      </Button>

      {error && <p className="text-[10px] text-red-400 font-bold">{error}</p>}
    </div>
  );
}
