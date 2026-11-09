export type Unit = "h" | "m" | "s" | "ms";
export const UNIT_MS: Record<Unit, number> = { h: 3600000, m: 60000, s: 1000, ms: 1 };
export const UNIT_ORDER: Unit[] = ["h", "m", "s", "ms"];
export const UNIT_LABEL: Record<Unit, string> = { h: "Std", m: "Min", s: "Sek", ms: "Ms" };
export const MAX_TIMERS = 50;

export type Signal = "beep" | "vibrate" | "both" | "mute";
export type TimerCue = "standard" | "tone" | "voice" | "both" | "mute";
export interface TimerItem { id: string; name: string; ms: number; cue?: TimerCue }
export const MAX_BLOCKS = 30;
export type Cue = "tone" | "voice" | "both";
export interface Block { id: string; name: string; timers: TimerItem[]; rounds: number; open?: boolean }
export interface Chain {
  name: string; blocks?: Block[]; signal: Signal; units: Unit[];
  /** legacy single-block fields */
  timers?: TimerItem[]; rounds?: number;
  infinite?: boolean; prep?: boolean;
  finale?: boolean; finaleSound?: import("./sound").FinaleSound; warn?: boolean;
  sound?: import("./sound").SoundMode; volume?: number;
  cue?: Cue;
}
export type FullChain = Required<Omit<Chain, "timers" | "rounds">>;
export const CHAIN_DEFAULTS = {
  infinite: false, prep: true, finale: true, finaleSound: "gong",
  warn: false, sound: "beep", volume: 0.8, cue: "tone",
} as const;
export function withDefaults(c: Chain): FullChain {
  const { timers, rounds, ...rest } = c;
  const blocks: Block[] = c.blocks?.length
    ? c.blocks.map((b) => ({ ...b, id: b.id || newId(), rounds: Math.max(1, b.rounds || 1) }))
    : [{ id: newId(), name: "Block 1", timers: timers ?? [], rounds: Math.max(1, rounds ?? 1), open: true }];
  return { ...CHAIN_DEFAULTS, ...rest, blocks } as FullChain;
}

export interface Pos { block: number; round: number; index: number }
export type PresetAction = "replace" | "append" | "prepend";

/** Imports are atomic: reject overflow rather than silently dropping blocks. */
export function combinePreset(current: FullChain, preset: Chain, action: PresetAction): FullChain | null {
  const imported = withDefaults(preset);
  const count = imported.blocks.length + (action === "replace" ? 0 : current.blocks.length);
  if (count > MAX_BLOCKS) return null;
  const fresh = imported.blocks.map((b) => ({
    ...b, id: newId(), timers: b.timers.map((t) => ({ ...t, id: newId() })),
  }));
  if (action === "replace") return { ...imported, blocks: fresh };
  return { ...current, blocks: action === "append" ? [...current.blocks, ...fresh] : [...fresh, ...current.blocks] };
}

export function reorder<T>(items: T[], index: number, direction: number): T[] {
  const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
  const copy = [...items];
  const item = copy.splice(index, 1)[0];
  if (item === undefined) return items;
  copy.splice(target, 0, item);
  return copy;
}

export function blockJump(blocks: Block[], block: number, direction: -1 | 0 | 1): Pos | null {
  if (direction === 0) return blocks[block]?.timers.length ? { block, round: 1, index: 0 } : null;
  for (let k = block + direction; k >= 0 && k < blocks.length; k += direction) {
    if (blocks[k]?.timers.length) return { block: k, round: 1, index: 0 };
  }
  return null;
}

export function resolveTimerSignal(chain: Pick<FullChain, "cue" | "signal">, timer?: TimerItem) {
  const override = timer?.cue;
  if (override && override !== "standard") {
    return { tone: override === "tone" || override === "both", voice: override === "voice" || override === "both", vibration: false };
  }
  const audible = chain.signal === "beep" || chain.signal === "both";
  return {
    tone: audible && chain.cue !== "voice", voice: audible && chain.cue !== "tone",
    vibration: chain.signal === "vibrate" || chain.signal === "both",
  };
}

/** What follows the end of the step at `p`; null when the whole routine is done. */
export function nextPos(blocks: Block[], p: Pos, infinite: boolean): Pos | null {
  const b = blocks[p.block];
  if (b && p.index + 1 < b.timers.length) return { ...p, index: p.index + 1 };
  if (b && p.round < Math.max(1, b.rounds) && b.timers.length) return { block: p.block, round: p.round + 1, index: 0 };
  for (let k = p.block + 1; k < blocks.length; k++) if (blocks[k]!.timers.length) return { block: k, round: 1, index: 0 };
  if (infinite) {
    const k0 = blocks.findIndex((x) => x.timers.length);
    if (k0 < 0) return null;
    return { block: k0, round: blocks.length === 1 ? p.round + 1 : 1, index: 0 };
  }
  return null;
}
export function firstPos(blocks: Block[]): Pos | null {
  const k = blocks.findIndex((x) => x.timers.length);
  return k < 0 ? null : { block: k, round: 1, index: 0 };
}

/** Font size factor so `len` monospace chars fit in the container width (cqw units). */
export function fitCqw(len: number) {
  return 94 / (Math.max(1, len) * 0.62);
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
