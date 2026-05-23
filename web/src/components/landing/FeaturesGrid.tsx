"use client";
import { useEffect, useRef, useState } from "react";

const features = [
  {
    emoji: "📍",
    title: "Discover Near You",
    desc: "Live events filtered by distance, vibe, and who's going — so you always find something worth showing up for.",
    gradient: "from-[#FF4FD8] to-[#C96CFF]",
  },
  {
    emoji: "🎟️",
    title: "Instant Booking",
    desc: "Book a ticket in under 10 seconds. Group booking, split pricing, and guest invites all built in from day one.",
    gradient: "from-[#C96CFF] to-[#72B7FF]",
  },
  {
    emoji: "👥",
    title: "Invite Your Squad",
    desc: "Send a guest link. They get a full ticket flow without even needing an account. Zero friction for your crew.",
    gradient: "from-[#72B7FF] to-[#FFB6C8]",
  },
  {
    emoji: "💬",
    title: "Real-time Messaging",
    desc: "DMs and group chats tied to your social graph. Talk to attendees before, during, and after every event.",
    gradient: "from-[#FFB6C8] to-[#FFB347]",
  },
  {
    emoji: "🔔",
    title: "Live Notifications",
    desc: "Know when friends book the same event, when ticket availability drops, or when your guest accepts the invite.",
    gradient: "from-[#FFB347] to-[#FF4FD8]",
  },
  {
    emoji: "🎭",
    title: "Host Your Events",
    desc: "Create events in minutes. Set ticket tiers, manage your guest list, and track attendance in real time.",
    gradient: "from-[#FF4FD8] to-[#72B7FF]",
  },
];

function FeatureCard({ emoji, title, desc, gradient, delay }: typeof features[0] & { delay: number }) {
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
    <div
      ref={ref}
      className="liquid-glass shimmer-sweep rounded-[28px] p-7 group cursor-default transition-all duration-500 hover:-translate-y-2 hover:border-white/20"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 600ms ease-out ${delay}ms, transform 600ms ease-out ${delay}ms`,
      }}
    >
      {/* Shimmer */}
      <div
        className="absolute top-0 left-0 h-full w-[35%] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -skew-x-12 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ animation: "shimmer 3s ease-in-out infinite" }}
      />

      {/* Neon icon */}
      <div
        className={`h-14 w-14 rounded-[18px] bg-gradient-to-br ${gradient} mb-6 flex items-center justify-center text-2xl`}
        style={{ animation: "neon-pulse 3s ease-in-out infinite" }}
      >
        {emoji}
      </div>

      <h3 className="text-[19px] font-bold text-white mb-3 group-hover:text-brand-gradient transition-all duration-300">{title}</h3>
      <p className="text-[14px] leading-[1.7] text-white/55">{desc}</p>

      {/* Neon border bottom accent */}
      <div className={`mt-5 h-[1px] w-0 bg-gradient-to-r ${gradient} group-hover:w-full transition-all duration-500`} />
    </div>
  );
}

export default function FeaturesGrid() {
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
    <section id="features" className="relative z-10 py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Header */}
        <div
          className="text-center mb-16 transition-all duration-700"
          ref={ref}
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)" }}
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#FF4FD8] mb-4">Features</p>
          <h2 className="text-[42px] min-[900px]:text-[52px] font-extrabold text-white leading-tight tracking-tight">
            Everything you need<br />
            <span className="text-brand-gradient">to go out.</span>
          </h2>
          <p className="mt-5 text-[17px] text-white/55 max-w-[500px] mx-auto leading-relaxed">
            From discovery to the dancefloor — Happnix handles it all.
          </p>
        </div>

        {/* 3×2 grid */}
        <div className="grid grid-cols-1 min-[640px]:grid-cols-2 min-[900px]:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  );
}
