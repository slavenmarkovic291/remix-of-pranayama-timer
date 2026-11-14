import type { Practice } from "./library/types";
import { makeSession, type PracticeSession } from "./pranayama-session";
import { z } from "zod";

export interface PracticeSettings {
  mode: "paced" | "free" | "pulse";
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  rounds: number;
  minutes: number;
  pulseInterval: number;
  strokes: number;
  recovery: number;
}

export const hasPulseTiming = (p: Practice) => p.mechanics === "rapid" || p.mechanics === "abdominal" || p.id === "nadi-bhastrika";
export const parseTimingNumber = (text: string) => /^\d+(?:[.,]\d+)?$/.test(text.trim()) ? Number(text.trim().replace(",", ".")) : NaN;
const positive = z.number().finite().positive();
const nonnegative = z.number().finite().nonnegative();
const settingsSchema = z.object({
  mode: z.enum(["paced", "free", "pulse"]), inhale: positive, holdIn: nonnegative,
  exhale: positive, holdOut: nonnegative, rounds: positive.int().safe(), minutes: positive,
  pulseInterval: positive, strokes: positive.int().safe(), recovery: nonnegative,
}).refine((s) => [(s.inhale + s.holdIn + s.exhale + s.holdOut) * s.rounds * 2000,
  s.minutes * 60000, (s.pulseInterval * s.strokes + s.recovery) * s.rounds * 1000].every(Number.isFinite));

export function defaultPracticeSettings(p: Practice): PracticeSettings {
  const base = makeSession(p);
  const pulse = hasPulseTiming(p);
  return { mode: pulse ? "pulse" : base.paced && p.id !== "nadi-shuddhi" ? "paced" : "free",
    inhale: pulse ? 4 : p.timer?.inhale ?? 4, holdIn: pulse ? 0 : p.timer?.holdIn ?? 0,
    exhale: pulse ? 4 : p.timer?.exhale ?? 4, holdOut: p.timer?.holdOut ?? 0,
    rounds: base.rounds, minutes: p.id === "nadi-shuddhi" ? 4 : base.paced ? base.totalMs / 60000 : 3,
    pulseInterval: 1.5, strokes: 20, recovery: 30 };
}

export function validPracticeSettings(s: PracticeSettings): boolean {
  return settingsSchema.safeParse(s).success;
}

export function configuredPracticeSession(p: Practice, s: PracticeSettings): PracticeSession {
  if (!validPracticeSettings(s)) throw new Error("Ungültige Timerzeiten");
  if (s.mode === "free") {
    const ms = s.minutes * 60000;
    return { phases: [{ id: "observe", label: "Freies Atmen", phase: "neutral", ms,
      instruction: "Atme sanft in deinem eigenen Rhythmus. Folge der Anleitung dieser Praktik." }],
      rounds: 1, cycleMs: ms, totalMs: ms, paced: false };
  }
  if (s.mode === "pulse") {
    const intervalMs = s.pulseInterval * 1000;
    const phases: PracticeSession["phases"] = [{ id: "pulses", label: "Puls / Stoß", phase: "neutral", ms: intervalMs * s.strokes,
      instruction: p.id === "kapalabhati" ? "Kurz ausstoßen, dann die Einatmung passiv geschehen lassen." : "Folge pro Puls der Bewegung aus der Anleitung dieser Praktik." }];
    if (s.recovery > 0) phases.push({ id: "recovery", label: "Erholung", phase: "neutral", ms: s.recovery * 1000, instruction: "Ruhig im eigenen Rhythmus atmen." });
    const cycleMs = phases.reduce((sum, phase) => sum + phase.ms, 0);
    return { phases, rounds: s.rounds, cycleMs, totalMs: cycleMs * s.rounds, paced: true, pulse: { intervalMs, strokes: s.strokes } };
  }
  return makeSession({ ...p, timer: { ...p.timer, inhale: s.inhale, holdIn: s.holdIn,
    exhale: s.exhale, holdOut: s.holdOut, rounds: s.rounds } }, s.rounds, true);
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

export function resetPracticeSettings(id: string): boolean {
  try { localStorage.removeItem(key(id)); return true; } catch { return false; }
}