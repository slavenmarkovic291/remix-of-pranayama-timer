export type Unit = "h" | "m" | "s" | "ms";
export const UNIT_MS: Record<Unit, number> = { h: 3600000, m: 60000, s: 1000, ms: 1 };
export const UNIT_ORDER: Unit[] = ["h", "m", "s", "ms"];
export const UNIT_LABEL: Record<Unit, string> = { h: "Std", m: "Min", s: "Sek", ms: "Ms" };
export const MAX_TIMERS = 50;

export type Signal = "beep" | "vibrate" | "both" | "mute";
export interface TimerItem { id: string; name: string; ms: number }
export interface Chain { name: string; timers: TimerItem[]; signal: Signal; units: Unit[] }

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
