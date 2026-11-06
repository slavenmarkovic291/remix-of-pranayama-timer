export type Unit = "h" | "m" | "s" | "ms";
export const UNIT_MS: Record<Unit, number> = { h: 3600000, m: 60000, s: 1000, ms: 1 };
export const UNIT_ORDER: Unit[] = ["h", "m", "s", "ms"];
export const UNIT_LABEL: Record<Unit, string> = { h: "Std", m: "Min", s: "Sek", ms: "Ms" };
export const MAX_TIMERS = 50;

export type Signal = "beep" | "vibrate" | "both" | "mute";
export interface TimerItem { id: string; name: string; ms: number }
export interface Chain {
  name: string; timers: TimerItem[]; signal: Signal; units: Unit[];
  rounds?: number; infinite?: boolean; prep?: boolean;
  finale?: boolean; finaleSound?: "gong" | "triad"; warn?: boolean;
  sound?: "beep" | "rising" | "phase" | "fibonacci"; volume?: number;
}
export type FullChain = Required<Chain>;
export const CHAIN_DEFAULTS = {
  rounds: 1, infinite: false, prep: true, finale: true, finaleSound: "gong",
  warn: false, sound: "beep", volume: 0.8,
} as const;
export function withDefaults(c: Chain): FullChain {
  return { ...CHAIN_DEFAULTS, ...c } as FullChain;
}

/** Decide what follows the end of step `index` in round `round` (1-based). */
export function nextStep(index: number, round: number, count: number, rounds: number, infinite: boolean):
  { index: number; round: number } | null {
  if (index + 1 < count) return { index: index + 1, round };
  if (infinite || round < rounds) return { index: 0, round: round + 1 };
  return null;
}

export const ACCENTS = [
  { id: "amber", name: "Bernstein", color: "oklch(0.75 0.16 65)", fg: "oklch(0.18 0.03 60)" },
  { id: "gold", name: "Goldgelb", color: "oklch(0.85 0.16 90)", fg: "oklch(0.2 0.03 80)" },
  { id: "cream", name: "Cremeweiß", color: "oklch(0.94 0.04 85)", fg: "oklch(0.2 0.02 60)" },
  { id: "olive", name: "Olivgrün", color: "oklch(0.72 0.12 120)", fg: "oklch(0.18 0.03 120)" },
  { id: "pine", name: "Pinien-Dunkelgrün", color: "oklch(0.58 0.1 160)", fg: "oklch(0.97 0.01 160)" },
  { id: "lavender", name: "Lavendel", color: "oklch(0.78 0.1 300)", fg: "oklch(0.2 0.03 300)" },
  { id: "burgundy", name: "Burgunderrot", color: "oklch(0.5 0.15 15)", fg: "oklch(0.97 0.01 15)" },
  { id: "lucifer", name: "Lucifer Rouge", color: "oklch(0.63 0.26 27)", fg: "oklch(0.98 0.01 27)" },
  { id: "white", name: "Klassisches Weiß", color: "oklch(0.98 0 0)", fg: "oklch(0.15 0 0)" },
] as const;

/** Split ms into the enabled units; the largest enabled unit absorbs overflow. */
export function splitMs(total: number, units: Unit[]): Partial<Record<Unit, number>> {
  const enabled = UNIT_ORDER.filter((u) => units.includes(u));
  const out: Partial<Record<Unit, number>> = {};
  let rest = Math.max(0, total);
  for (const u of enabled) {
    out[u] = Math.floor(rest / UNIT_MS[u]);
    rest -= out[u]! * UNIT_MS[u];
  }
  return out;
}

export function joinMs(parts: Partial<Record<Unit, number>>): number {
  return UNIT_ORDER.reduce((a, u) => a + (parts[u] ?? 0) * UNIT_MS[u], 0);
}

/** Display format for a countdown; rounds up to the smallest enabled unit. */
export function formatMs(total: number, units: Unit[]): string {
  const enabled = UNIT_ORDER.filter((u) => units.includes(u));
  const smallest = UNIT_MS[enabled[enabled.length - 1] ?? "s"];
  const rounded = Math.ceil(Math.max(0, total) / smallest) * smallest;
  const p = splitMs(rounded, units);
  return enabled
    .map((u, i) => {
      const v = p[u] ?? 0;
      const s = String(v);
      if (i === 0) return s;
      return u === "ms" ? s.padStart(3, "0") : s.padStart(2, "0");
    })
    .reduce((acc, s, i) => (i === 0 ? s : acc + (enabled[i] === "ms" ? "." : ":") + s), "");
}

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}
