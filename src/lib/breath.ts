import type { TimerItem } from "./timer";

export type BreathPhase = "auto" | "in" | "out" | "holdFull" | "holdEmpty" | "neutral";
export const BREATH_PHASES: [BreathPhase, string][] = [
  ["auto", "Automatisch (nach Name)"], ["in", "Einatmen"], ["out", "Ausatmen"],
  ["holdFull", "Halten (voll)"], ["holdEmpty", "Halten (leer)"], ["neutral", "Neutral"],
];
type Resolved = Exclude<BreathPhase, "auto">;

const IN = /(^|[^a-zäöüß])(ein|einatmen|einatmung|in|inhale|inhalation|puraka|breathe in|einziehen)([^a-zäöüß]|$)/;
const OUT = /(^|[^a-zäöüß])(aus|ausatmen|ausatmung|out|exhale|exhalation|rechaka|breathe out)([^a-zäöüß]|$)/;
const HOLD = /(halt|hold|kumbhaka|pause|anhalten|stopp?)/;

/** Detects a breathing phase from a timer name, language-agnostic keywords, case-insensitive. */
export function phaseFromName(name: string): Resolved | "hold" {
  const n = name.toLowerCase().trim();
  if (HOLD.test(n)) return "hold";
  if (IN.test(n) || n.startsWith("ein")) return "in";
  if (OUT.test(n) || n.startsWith("aus")) return "out";
  return "neutral";
}

/** Resolves the phase of timer i; holds take full/empty from the preceding (cyclic) phase. */
export function resolvePhase(timers: TimerItem[], i: number): Resolved {
  const own = (k: number): Resolved | "hold" => {
    const t = timers[k];
    if (!t) return "neutral";
    if (t.phase && t.phase !== "auto") return t.phase;
    return phaseFromName(t.name);
  };
  const p = own(i);
  if (p !== "hold") return p;
  for (let s = 1; s < timers.length; s++) {
    const q = own((i - s + timers.length) % timers.length);
    if (q === "in" || q === "holdFull") return "holdFull";
    if (q === "out" || q === "holdEmpty") return "holdEmpty";
  }
  return "holdFull";
}

/** Circle size 0..1 given phase and remaining fraction (1 = just started). */
export function circleScale(phase: Resolved, remainingFrac: number): number {
  const done = 1 - remainingFrac;
  switch (phase) {
    case "in": return done;
    case "out": return remainingFrac;
    case "holdFull": return 1;
    case "holdEmpty": return 0;
    default: return remainingFrac;
  }
}
