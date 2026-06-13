"use client";
import React from "react";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { FAQType } from "@/types/event";

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
          className={`rounded-xl border transition-all overflow-hidden ${
            expanded === faq.id ? "border-[var(--brand-1)]/40 bg-[var(--brand-1)]/5" : "border-white/10 bg-white/3"
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <span className="text-[10px] font-black text-white/30 w-4 shrink-0">Q{idx + 1}</span>
            <input
              type="text"
              value={faq.question}
              onChange={(e) => update(faq.id, "question", e.target.value)}
              placeholder="What question do attendees ask?"
              className="flex-1 bg-transparent text-[11px] text-white placeholder-white/20 outline-none"
            />
            <button
              type="button"
              onClick={() => setExpanded(expanded === faq.id ? null : faq.id)}
              className="p-1 text-white/30 hover:text-white transition-colors"
            >
              {expanded === faq.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => remove(faq.id)}
              className="p-1 text-white/20 hover:text-red-400 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Answer */}
          {expanded === faq.id && (
            <div className="px-3 pb-2.5 pt-0 border-t border-white/5">
              <textarea
                value={faq.answer}
                onChange={(e) => update(faq.id, "answer", e.target.value)}
                placeholder="Provide a clear, helpful answer..."
                rows={3}
                className="w-full bg-transparent text-[11px] text-white/80 placeholder-white/20 outline-none resize-none mt-2"
              />
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1.5 text-[11px] text-[var(--brand-1)] hover:opacity-80 transition-opacity self-start mt-1"
      >
        <Plus className="h-3 w-3" /> Add FAQ
      </button>

      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
