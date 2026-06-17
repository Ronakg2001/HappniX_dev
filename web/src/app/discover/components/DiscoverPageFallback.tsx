export function DiscoverPageFallback() {
  return (
    <div className="flex-1 min-w-0 w-full flex flex-col gap-5 animate-pulse pb-16">
      <div className="h-11 rounded-xl bg-white/[0.04] border border-white/10" />
      <div className="flex gap-2">
        {[80, 110, 95, 120, 90].map((w, i) => (
          <div
            key={i}
            style={{ width: w }}
            className="h-7 rounded-full bg-white/[0.04] border border-white/10 shrink-0"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-sm overflow-hidden">
            <div className="h-44 bg-white/[0.04]" />
            <div className="h-20 bg-[#08080c] p-2.5 flex flex-col gap-2">
              <div className="h-3 w-3/4 bg-white/[0.06] rounded" />
              <div className="h-2.5 w-1/2 bg-white/[0.04] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
