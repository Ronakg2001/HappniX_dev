"use client";
import { useEffect, useRef, useState } from "react";

function HomeFeedMockup() {
  const events = [
    { emoji: "🎵", name: "NEON NIGHT", time: "Tonight · 9PM", dist: "2.4km", price: "₹800", going: 34, gradient: "from-[#FF4FD8]/50 to-[#C96CFF]/30" },
    { emoji: "🎨", name: "ART FEST", time: "Sat · 7PM", dist: "5.1km", price: "Free", going: 18, gradient: "from-[#72B7FF]/50 to-[#C96CFF]/30" },
    { emoji: "🕺", name: "TECHNO RAVE", time: "Sat · 11PM", dist: "8.2km", price: "₹1200", going: 67, gradient: "from-[#FFB347]/50 to-[#FF4FD8]/30" },
    { emoji: "🍸", name: "ROOFTOP JAZZ", time: "Sun · 8PM", dist: "3.7km", price: "₹500", going: 22, gradient: "from-[#FFB6C8]/50 to-[#72B7FF]/30" },
  ];

  return (
    <div className="relative">
      {/* Outer neon ring */}
      <div
        className="absolute -inset-[1px] rounded-[36px] opacity-60"
        style={{
          background: "conic-gradient(from 0deg, var(--brand-3), var(--brand-2), var(--brand-1), var(--brand-4), var(--brand-3))",
          animation: "neon-rotate 8s linear infinite",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1px",
        }}
      />
      <div className="liquid-glass liquid-edge rounded-[36px] p-6 w-full max-w-[420px] mx-auto relative overflow-hidden">
        {/* shimmer */}
        <div
          className="absolute top-0 left-0 h-full w-[40%] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-12 pointer-events-none"
          style={{ animation: "shimmer 5s ease-in-out infinite" }}
        />
        {/* Traffic lights */}
        <div className="flex gap-1.5 mb-5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[12px] text-white/40">Good evening</p>
            <p className="text-[18px] font-bold text-white">Discover events 🔥</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-brand-gradient flex items-center justify-center text-sm font-bold">A</div>
        </div>
        {/* 2×2 event grid */}
        <div className="grid grid-cols-2 gap-3">
          {events.map((e) => (
            <div key={e.name} className="stat-card-glass rounded-[14px] overflow-hidden hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
              <div className={`h-[54px] w-full bg-gradient-to-br ${e.gradient} relative`}>
                <span className="absolute bottom-1.5 left-2.5 text-lg">{e.emoji}</span>
                <span className="absolute top-1.5 right-1.5 bg-black/30 rounded-full px-1.5 py-0.5 text-[9px] text-white/80">{e.going} going</span>
              </div>
              <div className="p-2.5">
                <p className="text-[11px] font-bold text-white leading-tight">{e.name}</p>
                <p className="text-[10px] text-white/40 mt-0.5">{e.time} · {e.dist}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-bold text-brand-gradient">{e.price}</span>
                  <span className="bg-brand-gradient text-[9px] font-bold text-white rounded-full px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200">Book →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProductVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="relative z-10 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div ref={ref} className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-16 items-center">
          {/* Mockup */}
          <div className="flex justify-center min-[900px]:justify-start"
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(-24px)", transition: "all 700ms ease-out" }}>
            <HomeFeedMockup />
          </div>

          {/* Copy */}
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(24px)", transition: "all 700ms ease-out 150ms" }}>
            <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#FF4FD8] mb-5">The App</p>
            <h2 className="text-[38px] min-[900px]:text-[48px] font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              Real events.<br />
              Real people.<br />
              <span className="text-brand-gradient">Real moments.</span>
            </h2>
            <p className="text-[16px] leading-[1.75] text-white/55 mb-8">
              Join thousands of people already discovering their next experience with Happnix. Find events nearby, see what your friends are attending, and book in seconds.
            </p>
            {/* Mini feature list */}
            {["Discover events within 10km of you", "See friends attending before you book", "Group booking for your whole squad"].map((item) => (
              <div key={item} className="flex items-center gap-3 mb-4">
                <div className="h-5 w-5 rounded-full bg-brand-gradient shadow-glow flex items-center justify-center text-[10px] shrink-0">✓</div>
                <p className="text-[14px] text-white/65">{item}</p>
              </div>
            ))}
            <a href="/signin" className="inline-flex mt-6 bg-brand-gradient shadow-glow rounded-full px-7 py-3.5 text-[15px] font-semibold text-white hover:brightness-110 hover:-translate-y-0.5 transition-all duration-200">
              Browse Events →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
