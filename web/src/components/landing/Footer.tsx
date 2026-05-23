export default function Footer() {
  const cols = [
    {
      heading: "Product",
      links: ["Discover Events", "Group Bookings", "Guest Invites", "Host Events"],
      hrefs: ["#features", "#features", "#community", "#for-hosts"],
    },
    {
      heading: "Company",
      links: ["About", "Blog", "Careers", "Press"],
      hrefs: ["#", "#", "#", "#"],
    },
    {
      heading: "Legal",
      links: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
      hrefs: ["#", "#", "#"],
    },
  ];

  return (
    <footer className="relative z-10 border-t border-white/[0.06]">
      {/* Neon top line */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#FF4FD8]/25 to-transparent" />

      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid grid-cols-1 min-[640px]:grid-cols-2 min-[900px]:grid-cols-4 gap-10">
          {/* Brand col */}
          <div className="min-[900px]:col-span-1">
            <a href="#" className="text-brand-gradient text-shadow-glow text-[24px] font-extrabold leading-none tracking-tight mb-4 block">
              Happnix
            </a>
            <p className="text-[13px] text-white/40 leading-relaxed max-w-[200px] mt-4">
              Discover live events, book instantly, invite your squad.
            </p>
            {/* App store pill badges */}
            <div className="flex gap-2 mt-6">
              {["App Store", "Google Play"].map((s) => (
                <div key={s} className="stat-card-glass rounded-[10px] px-3 py-1.5 text-[10px] text-white/50 font-medium cursor-pointer hover:text-white/80 transition-colors duration-200">
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.heading}>
              <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-white/30 mb-5">{col.heading}</p>
              <ul className="flex flex-col gap-3">
                {col.links.map((link, i) => (
                  <li key={link}>
                    <a href={col.hrefs[i]} className="text-[14px] text-white/50 hover:text-white transition-colors duration-200 no-underline">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-white/[0.05] flex flex-col min-[640px]:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-white/30">© 2025 Happnix. Made with ✨ for event lovers.</p>
          <p className="text-[13px] text-white/20">Designed with the Happnix Design System</p>
        </div>
      </div>
    </footer>
  );
}
