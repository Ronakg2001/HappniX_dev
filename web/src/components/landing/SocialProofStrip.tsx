"use client";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: "10K+", label: "Events Hosted", color: "text-brand-gradient" },
  { value: "50K+", label: "Tickets Booked", color: "text-white" },
  { value: "4.9★", label: "App Rating", color: "text-brand-gradient" },
  { value: "Real-time", label: "Messaging", color: "text-white" },
];

export default function SocialProofStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-14 relative z-10">
      {/* Top gradient line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#FF4FD8]/30 to-transparent mb-12" />

      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-wrap items-center justify-center gap-10 min-[900px]:gap-16">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-1 transition-all duration-700"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(12px)",
                transitionDelay: `${i * 100}ms`,
              }}
            >
              <span className={`text-[32px] font-black ${s.color}`}>{s.value}</span>
              <span className="text-[13px] text-white/45 uppercase tracking-widest font-medium">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#72B7FF]/20 to-transparent mt-12" />
    </section>
  );
}
