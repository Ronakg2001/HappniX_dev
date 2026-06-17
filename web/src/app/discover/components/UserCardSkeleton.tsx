export function UserCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] animate-pulse">
      <div className="h-11 w-11 rounded-full bg-white/[0.07] shrink-0" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="h-3 w-32 bg-white/[0.07] rounded" />
        <div className="h-2.5 w-24 bg-white/[0.05] rounded" />
        <div className="h-2.5 w-48 bg-white/[0.04] rounded" />
      </div>
      <div className="h-8 w-20 rounded-lg bg-white/[0.06] shrink-0" />
    </div>
  );
}
