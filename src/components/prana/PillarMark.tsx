import type { PillarId } from "@/lib/learning";

export function PillarMark({ id, className = "" }: { id: PillarId; className?: string }) {
  return <svg viewBox="0 0 120 100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
    {id === "body" && <><path d="M24 83h72M36 83l9-26h30l9 26M45 57l6-19h18l6 19M51 38l9-17 9 17"/><path d="M24 72h72M41 66h38M48 47h24" opacity=".4"/><circle cx="60" cy="15" r="4"/></>}
    {id === "breath" && <><path d="M15 42c15-22 30-22 45 0s30 22 45 0M15 58c15-22 30-22 45 0s30 22 45 0"/><path d="M22 27c13-13 25-13 38 0s25 13 38 0M22 73c13-13 25-13 38 0s25 13 38 0" opacity=".4"/></>}
    {id === "sensory" && <><path d="M10 50s18-27 50-27 50 27 50 27-18 27-50 27S10 50 10 50Z"/><circle cx="60" cy="50" r="16"/><circle cx="60" cy="50" r="5"/><path d="M60 12v6M60 82v6M24 18l5 6M96 18l-5 6" opacity=".5"/></>}
    {id === "inner" && <><path d="M60 80C25 70 19 48 20 30c20 0 33 12 40 30 7-18 20-30 40-30 1 18-5 40-40 50Z"/><path d="M60 80C40 61 38 38 60 17c22 21 20 44 0 63ZM14 80c16 10 76 10 92 0"/><path d="M32 41l28 39 28-39" opacity=".4"/></>}
  </svg>;
}