"use client";
import React from "react";
import { Plus, X, ImageIcon } from "lucide-react";

interface ImageSlotGridProps {
  images: string[];
  onChange: (imgs: string[]) => void;
  max?: number;
  error?: string;
  label?: string;
}

export function ImageSlotGrid({ images, onChange, max = 9, error, label }: ImageSlotGridProps) {
  const handleUrlChange = (idx: number, url: string) => {
    const updated = [...images];
    updated[idx] = url;
    onChange(updated);
  };

  const addSlot = () => {
    if (images.length >= max) return;
    onChange([...images, ""]);
  };

  const removeSlot = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs font-bold text-white/50 uppercase tracking-wider">
          {label}
          <span className="font-normal normal-case tracking-normal text-white/30 ml-1">
            ({images.filter(Boolean).length}/{max} images)
          </span>
        </label>
      )}

      <div className="grid grid-cols-3 gap-2">
        {images.map((url, idx) => (
          <div key={idx} className="relative group">
            <div
              className={`aspect-square rounded-xl overflow-hidden border transition-all ${
                error && idx === 0 ? "border-red-500/60" : "border-white/10"
              } bg-white/5`}
            >
              {url ? (
                <img
                  src={url}
                  alt={`Highlight ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-white/20">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-[9px]">Paste URL</span>
                </div>
              )}
            </div>
            {/* URL input overlay */}
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(idx, e.target.value)}
              placeholder="Paste image URL..."
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              style={{ fontSize: 0 }}
            />
            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeSlot(idx)}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <X className="h-2.5 w-2.5" />
            </button>
            {/* Badge */}
            <div className="absolute bottom-1 left-1 bg-black/60 rounded-md px-1.5 py-0.5 text-[9px] text-white/60">
              #{idx + 1}
            </div>
          </div>
        ))}

        {/* URL input card */}
        {images.length < max && (
          <button
            type="button"
            onClick={addSlot}
            className="aspect-square rounded-xl border-2 border-dashed border-white/10 hover:border-[var(--brand-1)]/50 flex flex-col items-center justify-center gap-1.5 text-white/30 hover:text-[var(--brand-1)] transition-all cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span className="text-[9px] font-bold">Add Image</span>
          </button>
        )}
      </div>

      {/* Bulk URL input */}
      <div className="mt-1">
        <p className="text-[10px] text-white/30 mb-1">
          Click a slot then paste a URL, or click "Add Image" to add a slot.
        </p>
        {images.map((url, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] text-white/30 w-4 shrink-0">#{idx + 1}</span>
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(idx, e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white focus:outline-none focus:border-[var(--brand-1)] placeholder-white/20 transition-all"
            />
            <button
              type="button"
              onClick={() => removeSlot(idx)}
              className="p-1 text-white/30 hover:text-red-400 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={addSlot}
            className="flex items-center gap-1.5 text-[11px] text-[var(--brand-1)] hover:opacity-80 transition-opacity mt-1"
          >
            <Plus className="h-3 w-3" /> Add image slot
          </button>
        )}
      </div>

      {error && <p className="text-[10px] text-red-400">{error}</p>}
    </div>
  );
}
