"use client";
import { useEffect, useRef, useState } from "react";

const messages = [
  { sender: "Priya", text: "are we still going? 👀", me: false },
  { sender: "You", text: "yeah 100%, booked 4 tix 🎟", me: true },
  { sender: "Aryan", text: "see you there 🔥", me: false },
  { sender: "You", text: "gates open 9pm, be early", me: true },
];

function ChatMockup() {
  return (
    <div className="liquid-glass liquid-edge rounded-[28px] p-5 w-full max-w-[340px] mx-auto relative overflow-hidden">
      {/* shimmer */}
      <div className="absolute top-0 left-0 h-full w-[35%] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -skew-x-12 pointer-events-none"
        style={{ animation: "shimmer 4.5s ease-in-out infinite" }} />

      {/* Group header */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/[0.07]">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#FF4FD8] to-[#72B7FF] flex items-center justify-center text-sm">🎵</div>
        <div>
          <p className="text-[13px] font-bold text-white">Neon Night Group</p>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#28c840]" style={{ animation: "neon-pulse 2s ease-in-out infinite" }} />
            <span className="text-[10px] text-white/40">4 members online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-3 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.me ? "items-end" : "items-start"}`}>
            {!m.me && <p className="text-[10px] text-white/35 mb-1 ml-1">{m.sender}</p>}
            <div className={`max-w-[200px] rounded-[14px] px-3 py-2 text-[12px] ${
              m.me
                ? "bg-brand-gradient text-white rounded-br-[4px]"
                : "stat-card-glass text-white/80 rounded-bl-[4px]"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/[0.07]">
        <div className="flex-1 stat-card-glass rounded-full px-3 py-2 text-[11px] text-white/30">
          Type a message...
        </div>
        <button className="bg-brand-gradient h-7 w-7 rounded-full flex items-center justify-center text-[12px] shadow-glow flex-shrink-0">→</button>
      </div>
    </div>
  );
}

export default function CommunitySection() {
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
    <section id="community" className="relative z-10 py-24">
      {/* Section bg tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF4FD8]/[0.02] to-[#72B7FF]/[0.02] pointer-events-none" />

      <div ref={ref} className="mx-auto max-w-[1200px] px-6 grid grid-cols-1 min-[900px]:grid-cols-2 gap-16 items-center">
        {/* Copy */}
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(-24px)", transition: "all 700ms ease-out" }}>
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#C96CFF] mb-5">Community</p>
          <h2 className="text-[38px] min-[900px]:text-[48px] font-extrabold text-white leading-[1.1] tracking-tight mb-6">
            Your social graph<br />
            <span className="text-brand-gradient">goes out with you.</span>
          </h2>
          <p className="text-[16px] leading-[1.75] text-white/55 mb-8">
            Follow friends, see what events they&apos;re attending, invite them as guests, and keep the conversation going — before, during, and after every event.
          </p>
          {["DMs and group chats tied to events", "See when friends book the same night", "Guest invites with one shareable link"].map((item) => (
            <div key={item} className="flex items-center gap-3 mb-4">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#C96CFF] to-[#72B7FF] flex items-center justify-center text-[10px] shrink-0">✓</div>
              <p className="text-[14px] text-white/65">{item}</p>
            </div>
          ))}
        </div>

        {/* Chat mockup */}
        <div className="flex justify-center min-[900px]:justify-end"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "all 700ms ease-out 200ms" }}>
          <ChatMockup />
        </div>
      </div>
    </section>
  );
}
