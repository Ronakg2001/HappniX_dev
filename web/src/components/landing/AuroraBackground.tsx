"use client";
export default function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Aurora 1 — themed brand-1 */}
      <div
        className="absolute -top-[200px] -left-[150px] h-[700px] w-[700px] rounded-full opacity-[0.11] blur-[130px]"
        style={{
          backgroundColor: "var(--aurora-1)",
          animation: "aurora-drift 25s ease-in-out infinite",
        }}
      />
      {/* Aurora 2 — themed brand-3 */}
      <div
        className="absolute -bottom-[200px] -right-[150px] h-[600px] w-[600px] rounded-full opacity-[0.09] blur-[120px]"
        style={{
          backgroundColor: "var(--aurora-2)",
          animation: "aurora-drift 30s ease-in-out infinite 5s",
        }}
      />
      {/* Aurora 3 — themed brand-2 */}
      <div
        className="absolute top-[40%] left-[30%] h-[400px] w-[400px] rounded-full opacity-[0.06] blur-[100px]"
        style={{
          backgroundColor: "var(--aurora-3)",
          animation: "aurora-drift 20s ease-in-out infinite 10s",
        }}
      />
      {/* Aurora 4 — themed brand-4 accent */}
      <div
        className="absolute top-[10%] right-[15%] h-[280px] w-[280px] rounded-full opacity-[0.05] blur-[90px]"
        style={{
          backgroundColor: "var(--aurora-4)",
          animation: "orb-float 18s ease-in-out infinite 2s",
        }}
      />
    </div>
  );
}
