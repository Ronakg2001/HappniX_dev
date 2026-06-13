"use client";
import React, { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max?: number;
  label?: string;
  hint?: string;
  error?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder = "Type and press Enter",
  max = 10,
  label,
  hint,
  error,
}: TagInputProps) {
  const [input, setInput] = useState("");

  const add = () => {
    const tag = input.trim().toLowerCase().replace(/,/g, "");
    if (!tag) return;
    if (value.includes(tag)) { setInput(""); return; }
    if (value.length >= max) { setInput(""); return; }
    onChange([...value, tag]);
    setInput("");
  };

  const remove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && input === "" && value.length > 0) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
          {label}
          {max && <span className="font-normal normal-case tracking-normal text-white/30 ml-1">({value.length}/{max})</span>}
        </label>
      )}
      <div
        className={`w-full flex flex-wrap gap-1.5 min-h-[46px] px-4 py-3 rounded-[14px] liquid-glass liquid-edge transition-all duration-200 ${
          error ? "border-red-500/50" : "focus-within:border-[#FF4FD8]/50 focus-within:shadow-glow"
        }`}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--brand-1)]/15 border border-[var(--brand-1)]/30 text-[11px] font-bold text-[var(--brand-1)]"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="ml-0.5 hover:text-red-400 transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          onBlur={add}
          placeholder={value.length < max ? placeholder : ""}
          disabled={value.length >= max}
          className="flex-1 min-w-[120px] bg-transparent text-[15px] text-white placeholder:text-white/25 outline-none py-0.5"
        />
      </div>
      {(hint || error) && (
        <p className={`text-[10px] ${error ? "text-red-400" : "text-white/30"}`}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
