"use client";
import { useEffect, useRef, useState } from "react";

export default function CTABanner() {
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
    <section className="relative z-10 py-32 overflow-hidden">
      {/* Ambient glow behind */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full opacity-[0.08] blur-[100px] pointer-events-none"
        style={{ backgroundColor: "var(--aurora-1)", animation: "aurora-drift 15s ease-in-out infinite" }} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full opacity-[0.06] blur-[90px] pointer-events-none"
        style={{ backgroundColor: "var(--aurora-2)", animation: "aurora-drift 20s ease-in-out infinite 3s" }} />

      {/* Light beams */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[30%] left-0 h-[1.5px] w-[60%] -rotate-[10deg]"
          style={{ background: "linear-gradient(to right, transparent, rgba(var(--glow-rgb), 0.6), transparent)", animation: "light-beam 8s ease-in-out infinite" }} />
        <div className="absolute top-[60%] left-0 h-[1px] w-[50%] rotate-[6deg]"
          style={{ background: "linear-gradient(to right, transparent, rgba(var(--glow-rgb), 0.4), transparent)", animation: "light-beam 11s ease-in-out infinite 3s" }} />
      </div>

      <div
        ref={ref}
        className="relative z-10 mx-auto max-w-[800px] px-6 text-center transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)" }}
      >
        {/* Top neon line */}
        <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-[#FF4FD8] to-transparent mx-auto mb-10" />

        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#FF4FD8] mb-6">Don&apos;t miss out</p>

        <h2 className="text-[48px] min-[900px]:text-[64px] font-extrabold text-white leading-[1.0] tracking-[-2px] mb-6">
          Don&apos;t miss the<br />
          <span className="text-brand-gradient text-shadow-glow">next one.</span>
        </h2>

        <p className="text-[18px] text-white/55 leading-relaxed max-w-[500px] mx-auto mb-12">
          Events happen once. Happnix makes sure you&apos;re there.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/signin"
            className="bg-brand-gradient shadow-glow rounded-full px-9 py-4.5 text-[17px] font-bold text-white hover:brightness-110 hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden"
          >
            <span className="relative z-10">Get Started — It&apos;s Free</span>
            <span
              className="absolute top-0 left-0 h-full w-[50%] bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 pointer-events-none"
              style={{ animation: "shimmer 3s ease-in-out infinite" }}
            />
          </a>
          <a
            href="#features"
            className="liquid-glass liquid-edge rounded-full px-9 py-4.5 text-[17px] font-medium text-white hover:bg-white/[0.10] hover:-translate-y-0.5 transition-all duration-200"
          >
            Browse Events
          </a>
        </div>

        {/* Bottom neon line */}
        <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-[#72B7FF] to-transparent mx-auto mt-12" />
      </div>
    </section>
  );
}
