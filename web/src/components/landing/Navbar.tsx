"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Discover", href: "#features" },
    { label: "For Hosts", href: "#for-hosts" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Community", href: "#community" },
  ];

  return (
    <nav
      ref={ref}
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled
        ? "liquid-glass border-b border-white/[0.08]"
        : "bg-transparent"
        }`}
    >
      {/* Neon hairline on scroll */}
      {scrolled && (
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF4FD8]/40 to-transparent" />
      )}

      <div className="mx-auto max-w-[1200px] px-6 py-4 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 no-underline">
          <Image
            src="https://pub-4c14689c2e3349dd83f26b79045c7c84.r2.dev/Happnix.PNG"
            alt="Happnix Logo"
            width={400}
            height={100}
            className="w-[140px] h-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop links */}
        <div className="hidden min-[900px]:flex items-center gap-7">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-[15px] font-medium text-white/70 hover:text-white transition duration-200 no-underline"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden min-[900px]:flex items-center gap-3">
          {/* <a
            href="/signin"
            className="text-[14px] font-medium text-white/70 hover:text-white transition duration-200 px-4 py-2 rounded-full"
          >
            Sign In
          </a> */}
          <a
            href="/signin"
            className="bg-brand-gradient shadow-glow rounded-full px-5 py-2.5 text-[14px] font-semibold text-white hover:brightness-110 hover:-translate-y-0.5 transition-all duration-200 relative overflow-hidden"
          >
            <span className="relative z-10">Get Started</span>
            {/* shimmer */}
            <span
              className="absolute top-0 left-0 h-full w-[40%] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
              style={{ animation: "shimmer 3s ease-in-out infinite" }}
            />
          </a>
        </div>

        {/* Hamburger */}
        <button
          className="min-[900px]:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <span className={`block h-0.5 w-6 bg-white/80 transition-all duration-200 ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block h-0.5 w-6 bg-white/80 transition-all duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-6 bg-white/80 transition-all duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="min-[900px]:hidden liquid-glass border-t border-white/[0.06] px-6 py-5 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-[16px] text-white/80 hover:text-white transition duration-200 no-underline"
            >
              {l.label}
            </a>
          ))}
          <a href="/signin" className="bg-brand-gradient rounded-full px-5 py-3 text-center font-semibold text-white mt-2">
            Get Started
          </a>
        </div>
      )}
    </nav>
  );
}
