import type { ReactNode } from "react";

export type CircleStyle = "disc" | "ring" | "glow";
const MIN = 0.12;

export function BreathCircle({ scale, style, neutral, size, children }: {
  scale: number; style: CircleStyle; neutral: boolean; size: string; children?: ReactNode;
}) {
  const s = MIN + (1 - MIN) * Math.max(0, Math.min(1, scale));
  return (
    <div className="relative mx-auto grid place-items-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full border border-primary/20" />
      {neutral ? (
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="46" fill="none" className="stroke-primary" strokeWidth="4" strokeLinecap="round"
            pathLength={1} strokeDasharray={`${scale} 1`} />
        </svg>
      ) : (
        <div
          aria-hidden
          className={`absolute rounded-full ${style === "ring" ? "border-[6px] border-primary" : "bg-primary"} ${style === "disc" ? "opacity-80" : ""}`}
          style={{
            inset: 0, transform: `scale(${s})`,
            ...(style === "glow" ? {
              background: "radial-gradient(circle, var(--primary) 0%, color-mix(in oklab, var(--primary) 45%, transparent) 55%, transparent 72%)",
              boxShadow: "0 0 60px color-mix(in oklab, var(--primary) 40%, transparent)",
            } : {}),
          }}
        />
      )}
      <div className="relative z-10 w-[70%] text-center mix-blend-difference">{children}</div>
    </div>
  );
}
