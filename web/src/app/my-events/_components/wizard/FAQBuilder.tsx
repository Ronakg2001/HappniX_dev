"use client";
import React from "react";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { FAQType } from "@/types/event";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface FAQBuilderProps {
  value: FAQType[];
  onChange: (faqs: FAQType[]) => void;
  error?: string;
}

export function FAQBuilder({ value, onChange, error }: FAQBuilderProps) {
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const add = () => {
    const newFaq: FAQType = { id: `faq_${Date.now()}`, question: "", answer: "" };
    onChange([...value, newFaq]);
    setExpanded(newFaq.id);
  };

  const remove = (id: string) => {
    onChange(value.filter((f) => f.id !== id));
    if (expanded === id) setExpanded(null);
  };

  const update = (id: string, field: "question" | "answer", val: string) => {
    onChange(value.map((f) => (f.id === id ? { ...f, [field]: val } : f)));
  };

  return (
    <div className="flex flex-col gap-2">
      {value.map((faq, idx) => (
        <div
          key={faq.id}
          className={`rounded-lg border transition-all overflow-hidden ${
            expanded === faq.id ? "border-[var(--brand-1)]/40 bg-[var(--brand-1)]/5" : "border-white/15 bg-white/5"
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <span className="text-[10px] font-black text-white/30 w-4 shrink-0">Q{idx + 1}</span>
            <Input
              type="text"
              value={faq.question}
              onChange={(e) => update(faq.id, "question", e.target.value)}
              placeholder="What question do attendees ask?"
              className="flex-1 bg-[#12121a] text-xs h-8.5 rounded-lg border border-white/10 px-3 py-2"
            />
            <Button
              type="button"
              onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
              variant="ghost"
              size="icon-xs"
              className="text-white/30 hover:text-white transition-colors h-7 w-7"
            >
              {expanded === faq.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            <Button
              type="button"
              onClick={() => remove(faq.id)}
              variant="ghost"
              size="icon-xs"
              className="text-white/20 hover:text-red-400 transition-colors h-7 w-7"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Answer */}
          {expanded === faq.id && (
            <div className="px-3 pb-3 pt-0 border-t border-white/5">
              <Textarea
                value={faq.answer}
                onChange={(e) => update(faq.id, "answer", e.target.value)}
                placeholder="Provide a clear, helpful answer..."
                rows={3}
                className="w-full bg-[#12121a] text-xs rounded-lg border border-white/10 mt-2.5"
              />
            </div>
          )}
        </div>
      ))}

      <Button
        type="button"
        onClick={add}
        variant="ghost"
        size="sm"
        className="flex items-center gap-1.5 text-[11px] text-[var(--brand-1)] hover:opacity-80 transition-opacity self-start mt-1 px-1 h-auto py-1"
      >
        <Plus className="h-3 w-3" /> Add FAQ
      </Button>

      {error && <p className="text-[10px] text-red-400 font-bold">{error}</p>}
    </div>
  );
}
