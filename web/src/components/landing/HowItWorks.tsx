"use client";
import { useEffect, useRef, useState } from "react";

const steps = [
  {
    num: "01",
    icon: "📱",
    title: "Open the app",
    desc: "Set your location, browse what's happening tonight, this weekend, or whenever you're free.",
  },
  {
    num: "02",
    icon: "🎟️",
    title: "Pick an event",
    desc: "Book in seconds. Invite friends with one link. Your whole squad — sorted in under a minute.",
  },
  {
    num: "03",
    icon: "✨",
    title: "Show up",
    desc: "Your digital ticket lives in the app. Scan and go. Real-time chat keeps the vibe alive.",
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="relative z-10 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#72B7FF] mb-4">How It Works</p>
          <h2 className="text-[42px] min-[900px]:text-[52px] font-extrabold text-white leading-tight">
            Three steps.{" "}
            <span className="text-brand-gradient">That&apos;s it.</span>
          </h2>
        </div>

        {/* Steps */}
        <div ref={ref} className="grid grid-cols-1 min-[900px]:grid-cols-3 gap-8 relative">
          {/* Connector line on desktop */}
          <div className="hidden min-[900px]:block absolute top-[52px] left-[16.67%] right-[16.67%] h-[1px] bg-gradient-to-r from-[#FF4FD8]/30 via-[#72B7FF]/30 to-[#FFB347]/30 border-dashed" />

          {steps.map((s, i) => (
            <div
              key={s.num}
              className="relative text-center transition-all duration-700"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(28px)",
                transitionDelay: `${i * 150}ms`,
              }}
            >
              {/* Background number */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[100px] font-black text-white/[0.03] leading-none select-none pointer-events-none">
                {s.num}
              </div>

              {/* Icon container */}
              <div
                className="relative mx-auto mb-6 h-[72px] w-[72px] rounded-[22px] liquid-glass flex items-center justify-center text-[30px]"
                style={{ animation: "neon-pulse 3s ease-in-out infinite" }}
              >
                {s.icon}
                {/* Top edge highlight */}
                <div className="absolute top-0 left-0 right-0 h-[1px] rounded-t-[22px] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              </div>

              <h3 className="text-[20px] font-bold text-white mb-3">{s.title}</h3>
              <p className="text-[15px] leading-[1.7] text-white/55 max-w-[240px] mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
