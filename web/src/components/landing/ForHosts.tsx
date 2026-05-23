"use client";
import { useEffect, useRef, useState } from "react";

const hostStats = [
  { value: "3 min", label: "Average event setup", gradient: "from-[#FF4FD8] to-[#C96CFF]" },
  { value: "0%", label: "Fee on free events", gradient: "from-[#C96CFF] to-[#72B7FF]" },
  { value: "Live", label: "Attendee tracking", gradient: "from-[#72B7FF] to-[#FFB6C8]" },
  { value: "Instant", label: "Revenue settlement", gradient: "from-[#FFB347] to-[#FF4FD8]" },
];

export default function ForHosts() {
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
    <section id="for-hosts" className="relative z-10 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Card wrapper */}
        <div
          ref={ref}
          className="liquid-glass liquid-edge rounded-[36px] p-10 min-[900px]:p-14 relative overflow-hidden transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)" }}
        >
          {/* Shimmer */}
          <div
            className="absolute top-0 left-0 h-full w-[35%] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-12 pointer-events-none"
            style={{ animation: "shimmer 6s ease-in-out infinite" }}
          />
          {/* Neon border */}
          <div
            className="absolute -inset-[1px] rounded-[36px] opacity-40 pointer-events-none"
            style={{
              background: "conic-gradient(from 0deg, var(--brand-4), var(--brand-1), var(--brand-2), var(--brand-3), var(--brand-4))",
              animation: "neon-rotate 12s linear infinite",
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              padding: "1px",
            }}
          />

          <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-12 items-center relative z-10">
            {/* Copy */}
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#FFB347] mb-5">For Event Creators</p>
              <h2 className="text-[36px] min-[900px]:text-[44px] font-extrabold text-white leading-tight tracking-tight mb-6">
                Host events that<br />
                <span className="text-brand-gradient">people actually come to.</span>
              </h2>
              <p className="text-[15px] leading-[1.75] text-white/55 mb-8">
                Create your event in minutes. Set ticket tiers. Manage guest lists. Track who&apos;s attending in real time. Get paid.
              </p>
              <a
                href="/signin?role=host"
                className="inline-flex bg-brand-gradient shadow-glow rounded-full px-7 py-3.5 text-[15px] font-semibold text-white hover:brightness-110 hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden"
              >
                <span className="relative z-10">Start Hosting →</span>
                <span
                  className="absolute top-0 left-0 h-full w-[50%] bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 pointer-events-none"
                  style={{ animation: "shimmer 3s ease-in-out infinite" }}
                />
              </a>
            </div>

            {/* Stat cards 2x2 */}
            <div className="grid grid-cols-2 gap-4">
              {hostStats.map((s, i) => (
                <div
                  key={s.label}
                  className="stat-card-glass rounded-[20px] p-5 hover:-translate-y-1 transition-all duration-300"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <p className={`text-[28px] font-black bg-gradient-to-r ${s.gradient} bg-clip-text text-transparent`}>{s.value}</p>
                  <p className="text-[12px] text-white/45 mt-1 leading-snug">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
