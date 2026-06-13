"use client";
import React, { useState, useCallback, useMemo } from "react";
import { 
  Check, 
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  PenTool,
  Eye
} from "lucide-react";
import { CreatedEventType } from "@/types/event";
import { validateStep1 } from "./Step1BasicDetails";
import { validateStep2 } from "./Step2EventDetails";
import { validateStep3 } from "./Step3Ticketing";
import { EventPreview, getPublishErrors } from "./EventPreview";

import { FormCoreDetails } from "./FormCoreDetails";
import { FormPerksLineup } from "./FormPerksLineup";
import { FormTicketingFAQs } from "./FormTicketingFAQs";

import { Button } from "@/components/ui/button";
import { useLayout } from "@/components/layout/AppLayout";
import { useRouter } from "next/navigation";

interface EventBuilderProps {
  ev: CreatedEventType;
  onUpdate: (patch: Partial<CreatedEventType>) => void;
  onPublish: () => void;
}

export function EventBuilder({ ev, onUpdate, onPublish }: EventBuilderProps) {
  const router = useRouter();
  const { updateEventLiveState } = useLayout();

  // View Mode: 'edit' or 'preview'
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  // Form Sub-Tabs: 'event' | 'perks' | 'tickets'
  const [activeSubTab, setActiveSubTab] = useState<"event" | "perks" | "tickets">("event");

  // Form State
  const [form, setForm] = useState<Partial<CreatedEventType>>({ ...ev });
  const [hasTriedPublish, setHasTriedPublish] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const patch = useCallback((p: Partial<CreatedEventType>) => {
    setForm(prev => ({ ...prev, ...p }));
  }, []);

  // Real-time validations
  const step1Errs = useMemo(() => validateStep1(form), [form]);
  const step2Errs = useMemo(() => validateStep2(form), [form]);
  const step3Errs = useMemo(() => validateStep3(form), [form]);
  
  const publishErrors = useMemo(() => getPublishErrors(form), [form]);
  const isPublishable = publishErrors.length === 0;

  // Save draft locally
  const handleSaveDraft = () => {
    setSaveStatus("saving");
    onUpdate(form);
    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 600);
  };

  const handlePublish = () => {
    setHasTriedPublish(true);
    if (!isPublishable) {
      setViewMode("edit");
      // Find the first tab with error and switch to it
      if (Object.keys(step1Errs).length > 0) {
        setActiveSubTab("event");
      } else if (Object.keys(step2Errs).length > 0) {
        setActiveSubTab("perks");
      } else if (Object.keys(step3Errs).length > 0) {
        setActiveSubTab("tickets");
      }
      return;
    }

    updateEventLiveState(ev.id, { registrationOpen: true, isPublic: true });
    onUpdate({ ...form, status: "Upcoming" });
    onPublish();
  };

  const handleBack = () => {
    onUpdate(form);
    router.push("/my-events");
  };

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full animate-in fade-in duration-300">
      
      {/* Top Action Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/20">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2 text-white/60 hover:text-white text-xs font-bold cursor-pointer transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> Back
          </Button>
          <span className="h-4 w-[2px] bg-white/20" />
          <div>
            <h1 className="text-base font-black text-white flex items-center gap-2">
              {form.title || "Untitled Event"}
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-bold text-white/50 tracking-wider uppercase">
                {form.status || "Draft"}
              </span>
            </h1>
          </div>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto">
          <Button
            variant="ghost"
            onClick={() => setViewMode("edit")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer h-auto ${
              viewMode === "edit" ? "bg-white/10 text-white hover:bg-white/10 hover:text-white" : "text-white/40 hover:text-white/70 hover:bg-transparent"
            }`}
          >
            <PenTool className="h-3.5 w-3.5" /> Edit Form
          </Button>
          <Button
            variant="ghost"
            onClick={() => setViewMode("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer h-auto ${
              viewMode === "preview" ? "bg-white/10 text-white hover:bg-white/10 hover:text-white" : "text-white/40 hover:text-white/70 hover:bg-transparent"
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> Live Preview
          </Button>
        </div>

        <div className="flex items-center gap-3.5 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-white/80 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            {saveStatus === "saving" && <span className="h-3 w-3 rounded-full border-2 border-white/20 border-t-white animate-spin" />}
            {saveStatus === "saved" && <Check className="h-3.5 w-3.5 text-green-400" />}
            {saveStatus === "saved" ? "Draft Saved!" : saveStatus === "saving" ? "Saving..." : "Save Draft"}
          </Button>

          <div className="relative group">
            <Button
              variant="brand"
              onClick={handlePublish}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-black shadow-glow transition-all uppercase tracking-wider flex items-center gap-2 cursor-pointer ${
                !isPublishable && "opacity-50 hover:opacity-60"
              }`}
            >
              Publish Event
            </Button>
            {hasTriedPublish && !isPublishable && (
              <div className="absolute right-0 top-full mt-2 w-64 p-3 rounded-xl bg-red-950 border border-red-800 text-[10px] text-red-300 shadow-xl z-50 pointer-events-none animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                  Please resolve these issues:
                </div>
                <ul className="list-disc pl-3.5 space-y-0.5">
                  {publishErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>   
      
      {/* Main Workspace Frame */}
      <div className="w-full">
        {viewMode === "edit" ? (
          /* Form Mode: Spaced out wide layout */
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Form Focus Sub-Tabs */}
            <div className="flex border-b border-white/10 bg-white/[0.02] rounded-xl p-1 gap-1">
              {[
                { id: "event" as const, label: "1. Event Details", errorsCount: Object.keys(step1Errs).length },
                { id: "perks" as const, label: "2. Highlights & Lineup", errorsCount: Object.keys(step2Errs).length },
                { id: "tickets" as const, label: "3. Tickets & FAQs", errorsCount: Object.keys(step3Errs).length }
              ].map((tab) => {
                const active = activeSubTab === tab.id;
                const hasErr = hasTriedPublish && tab.errorsCount > 0;
                return (
                  <Button
                    key={tab.id}
                    type="button"
                    variant={active ? "secondary" : "ghost"}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all relative flex items-center justify-center gap-1.5 cursor-pointer ${
                      active 
                        ? "bg-white/20 text-white" 
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    {tab.label}
                    {hasErr && (
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                    )}
                  </Button>
                );
              })}
            </div>

            {/* Sub-Tab Forms */}
            <>
              {activeSubTab === "event" && (
                <FormCoreDetails 
                  data={form} 
                  onChange={patch} 
                  errors={hasTriedPublish ? step1Errs : {}} 
                />
              )}
              {activeSubTab === "perks" && (
                <FormPerksLineup 
                  data={form} 
                  onChange={patch} 
                  errors={hasTriedPublish ? step2Errs : {}} 
                />
              )}
              {activeSubTab === "tickets" && (
                <FormTicketingFAQs 
                  data={form} 
                  onChange={patch} 
                  errors={hasTriedPublish ? step3Errs : {}} 
                />
              )}
            </>

            {/* Next tab navigation helper button */}
            <div className="flex justify-end pt-2">
              {activeSubTab === "event" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveSubTab("perks")}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-xs font-bold text-white/80 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Highlights & Lineup <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              {activeSubTab === "perks" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveSubTab("tickets")}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-xs font-bold text-white/80 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Tickets & FAQs <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Live Preview Mode: Full width simulation */
          <div className="max-w-4xl mx-auto animate-in fade-in duration-200">
            <EventPreview 
              data={form} 
              publishErrors={publishErrors}
              hideChecklist={true} 
            />
          </div>
        )}
      </div>

    </div>
  );
}
