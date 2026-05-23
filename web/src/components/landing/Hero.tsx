"use client";

function NeonCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Rotating neon border */}
      <div
        className="absolute -inset-[1px] rounded-[33px] opacity-70"
        style={{
          background: "conic-gradient(from 0deg, var(--brand-1), var(--brand-2), var(--brand-3), var(--brand-4), var(--brand-1))",
          animation: "neon-rotate 4s linear infinite",
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1px",
        }}
      />
      {children}
    </div>
  );
}

function EventCard({ emoji, name, time, distance, price, gradient }: {
  emoji: string; name: string; time: string; distance: string; price: string; gradient: string;
}) {
  return (
    <div className="stat-card-glass rounded-[16px] overflow-hidden">
      {/* Cover */}
      <div className={`h-[64px] w-full ${gradient} relative`}>
        <div className="absolute bottom-2 left-3 text-[20px]">{emoji}</div>
      </div>
      <div className="p-3">
        <p className="text-[13px] font-semibold text-white leading-tight truncate">{name}</p>
        <p className="text-[11px] text-white/50 mt-0.5">{time} · {distance}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] font-bold text-brand-gradient">{price}</span>
          <button className="bg-brand-gradient rounded-full px-2.5 py-1 text-[10px] font-semibold text-white">Book</button>
        </div>
      </div>
    </div>
  );
}

function AppMockup() {
  return (
    <NeonCard>
      <div className="liquid-glass liquid-edge rounded-[32px] p-5 w-full max-w-[340px] mx-auto">
        {/* shimmer */}
        <div
          className="absolute top-0 left-0 h-full w-[40%] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -skew-x-12 pointer-events-none"
          style={{ animation: "shimmer 4s ease-in-out infinite" }}
        />
        {/* Traffic lights */}
        <div className="flex gap-1.5 mb-4">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </div>
        {/* Greeting */}
        <p className="text-[13px] text-white/50 mb-0.5">Good evening, Arjun 👋</p>
        <p className="text-[16px] font-bold text-white mb-4">13 events near you tonight</p>
        {/* Event cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <EventCard emoji="🎵" name="NEON NIGHT" time="Tonight 9PM" distance="2.4km" price="₹800" gradient="bg-gradient-to-br from-[#FF4FD8]/60 to-[#C96CFF]/40" />
          <EventCard emoji="🎨" name="ART FEST" time="Sat 7PM" distance="5.1km" price="Free" gradient="bg-gradient-to-br from-[#72B7FF]/60 to-[#C96CFF]/40" />
        </div>
        {/* Bottom bar */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-brand-gradient flex items-center justify-center text-[9px]">👥</div>
            <span className="text-[11px] text-white/50">14 friends going</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px]">💬</span>
            <span className="text-[11px] text-white/50">7 active chats</span>
          </div>
        </div>
      </div>
    </NeonCard>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Light beams */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[20%] left-0 h-[1px] w-[55%] -rotate-[12deg]"
          style={{ background: "linear-gradient(to right, transparent, rgba(var(--glow-rgb), 0.5), transparent)", animation: "light-beam 10s ease-in-out infinite" }} />
        <div className="absolute top-[55%] left-0 h-[1px] w-[45%] rotate-[8deg]"
          style={{ background: "linear-gradient(to right, transparent, rgba(var(--glow-rgb), 0.35), transparent)", animation: "light-beam 14s ease-in-out infinite 3s" }} />
        <div className="absolute bottom-[25%] left-0 h-[1px] w-[40%] -rotate-[5deg]"
          style={{ background: "linear-gradient(to right, transparent, rgba(var(--glow-rgb), 0.3), transparent)", animation: "light-beam 18s ease-in-out infinite 7s" }} />
      </div>

      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-20 grid grid-cols-1 gap-16 min-[900px]:grid-cols-2 min-[900px]:gap-12 items-center w-full">
        {/* Left column */}
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--brand-1)", animation: "ping-slow 1.5s ease-out infinite" }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: "var(--brand-1)" }} />
            </span>
            <span className="text-[13px] font-medium text-white/70">📍 Live events near you</span>
          </div>

          {/* H1 */}
          <h1 className="text-[58px] min-[900px]:text-[72px] font-extrabold leading-[1.0] tracking-[-2px] text-white mb-6">
            Find your next<br />
            experience<br />
            with{" "}
            <span className="text-brand-gradient text-shadow-glow">Happnix.</span>
          </h1>

          <p className="text-[18px] leading-[1.75] text-white/60 max-w-[460px] mb-10">
            Discover live events around you, book tickets in seconds,
            invite your squad, and stay connected — all in one place.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <a
              href="/signin"
              className="bg-brand-gradient shadow-glow rounded-full px-8 py-4 text-[16px] font-semibold text-white hover:brightness-110 hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden"
            >
              <span className="relative z-10">Get Started →</span>
              <span className="absolute top-0 left-0 h-full w-[50%] bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 pointer-events-none"
                style={{ animation: "shimmer 3.5s ease-in-out infinite" }} />
            </a>
            <a
              href="#how-it-works"
              className="liquid-glass liquid-edge rounded-full px-8 py-4 text-[16px] text-white hover:bg-white/[0.10] hover:-translate-y-0.5 transition-all duration-200"
            >
              ▷ How it works
            </a>
          </div>
        </div>

        {/* Right column — app mockup */}
        <div className="flex justify-center min-[900px]:justify-end">
          <AppMockup />
        </div>
      </div>
    </section>
  );
}
