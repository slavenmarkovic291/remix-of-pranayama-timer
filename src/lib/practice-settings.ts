import type { Practice } from "./library/types";
import { makeSession, type PracticeSession } from "./pranayama-session";

export interface PracticeSettings {
  mode: "paced" | "free";
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  rounds: number;
  minutes: number;
}

export function defaultPracticeSettings(p: Practice): PracticeSettings {
  const base = makeSession(p);
  return { mode: base.paced && p.id !== "nadi-shuddhi" ? "paced" : "free",
    inhale: p.timer?.inhale ?? 4, holdIn: p.timer?.holdIn ?? 0,
    exhale: p.timer?.exhale ?? 4, holdOut: p.timer?.holdOut ?? 0,
    rounds: base.rounds, minutes: p.id === "nadi-shuddhi" ? 4 : base.paced ? base.totalMs / 60000 : 3 };
}

export function validPracticeSettings(s: PracticeSettings): boolean {
  return (s.mode === "paced" || s.mode === "free")
    && [s.inhale, s.exhale, s.minutes].every((n) => Number.isFinite(n) && n > 0)
    && [s.holdIn, s.holdOut].every((n) => Number.isFinite(n) && n >= 0)
    && Number.isSafeInteger(s.rounds) && s.rounds >= 1
    && Number.isFinite((s.inhale + s.holdIn + s.exhale + s.holdOut) * s.rounds * 2000)
    && Number.isFinite(s.minutes * 60000);
}

export function configuredPracticeSession(p: Practice, s: PracticeSettings): PracticeSession {
  if (!validPracticeSettings(s)) throw new Error("Ungültige Timerzeiten");
  if (s.mode === "free" || !makeSession(p).paced) {
    const ms = s.minutes * 60000;
    return { phases: [{ id: "observe", label: "Freies Atmen", phase: "neutral", ms,
      instruction: "Atme sanft in deinem eigenen Rhythmus. Folge der Anleitung dieser Praktik." }],
      rounds: 1, cycleMs: ms, totalMs: ms, paced: false };
  }
  return makeSession({ ...p, timer: { ...p.timer, inhale: s.inhale, holdIn: s.holdIn,
    exhale: s.exhale, holdOut: s.holdOut, rounds: s.rounds } }, s.rounds);
}

const key = (id: string) => `prana.practice-times.v1.${id}`;

/** Call only after hydration or from a user action; never touch studio storage. */
export function loadPracticeSettings(p: Practice): PracticeSettings {
  const defaults = defaultPracticeSettings(p);
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key(p.id)) ?? "null");
    if (!stored || typeof stored !== "object") return defaults;
    const merged = { ...defaults, ...stored } as PracticeSettings;
    return validPracticeSettings(merged) ? merged : defaults;
  } catch { return defaults; }
}

export function savePracticeSettings(id: string, s: PracticeSettings): boolean {
  if (!validPracticeSettings(s)) return false;
  try { localStorage.setItem(key(id), JSON.stringify(s)); return true; }
  catch { return false; }
}