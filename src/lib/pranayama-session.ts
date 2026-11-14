import type { Practice } from "./library/types";
import { circleScale, type BreathPhase } from "./breath";

export interface PracticePhase {
  id: string;
  label: string;
  ms: number;
  phase: Exclude<BreathPhase, "auto">;
  instruction?: string | undefined;
}
export interface PracticeSession {
  phases: PracticePhase[];
  rounds: number;
  cycleMs: number;
  totalMs: number;
  paced: boolean;
}

/** Do not convert bursts, segmented breathing or unverified retentions into a single long inhale. */
export function sessionPhases(p: Practice): PracticePhase[] {
  const t = p.timer;
  if (!t || ["rapid", "abdominal", "segmental"].includes(p.mechanics)
    || ["physiological-sigh", "cyclic-sighing", "cyclic-hyperventilation", "wim-hof"].includes(p.id)) {
    return [{ id: "observe", label: "Eigene Praxis", phase: "neutral", ms: 60000,
      instruction: "Folge der Durchführung dieser Praktik, nicht einem vorgegebenen Atemtakt." }];
  }
  const inhale = (id = "in", instruction?: string): PracticePhase => ({ id, label: "Einatmen", ms: t.inhale * 1000, phase: "in", instruction });
  const exhale = (id = "out", instruction?: string): PracticePhase => ({ id, label: "Ausatmen", ms: t.exhale * 1000, phase: "out", instruction });
  if (p.id === "nadi-shodhana" || p.id === "anuloma-viloma") {
    return [inhale("in-left", "Links einatmen"),
      ...(t.holdIn ? [{ id: "hold-left", label: "Halten · voll", ms: t.holdIn * 1000, phase: "holdFull" as const }] : []),
      exhale("out-right", "Rechts ausatmen"),
      ...(t.holdOut ? [{ id: "empty-right", label: "Halten · leer", ms: t.holdOut * 1000, phase: "holdEmpty" as const }] : []),
      inhale("in-right", "Rechts einatmen"),
      ...(t.holdIn ? [{ id: "hold-right", label: "Halten · voll", ms: t.holdIn * 1000, phase: "holdFull" as const }] : []),
      exhale("out-left", "Links ausatmen"),
      ...(t.holdOut ? [{ id: "empty-left", label: "Halten · leer", ms: t.holdOut * 1000, phase: "holdEmpty" as const }] : [])];
  }
  return [inhale(),
    ...(t.holdIn ? [{ id: "hold-full", label: "Halten · voll", ms: t.holdIn * 1000, phase: "holdFull" as const }] : []),
    exhale(),
    ...(t.holdOut ? [{ id: "hold-empty", label: "Halten · leer", ms: t.holdOut * 1000, phase: "holdEmpty" as const }] : [])];
}

export function makeSession(p: Practice, rounds?: number): PracticeSession {
  const phases = sessionPhases(p);
  const paced = phases[0]?.phase !== "neutral";
  const cycleMs = phases.reduce((sum, phase) => sum + phase.ms, 0);
  const count = Math.max(1, Math.floor(rounds ?? (paced ? p.timer?.rounds ?? 3 : 3)));
  return { phases, rounds: count, cycleMs, totalMs: cycleMs * count, paced };
}

/** A duration choice always ends at a complete cycle, never midway through a breath. */
export function roundsForMinutes(session: PracticeSession, minutes: number): number {
  return Math.max(1, Math.ceil(minutes * 60000 / session.cycleMs));
}

export function sessionAt(session: PracticeSession, elapsed: number) {
  const ms = Math.max(0, Math.min(session.totalMs, elapsed));
  const finished = ms >= session.totalMs;
  const round = Math.min(session.rounds, Math.floor(ms / session.cycleMs) + 1);
  let within = finished ? session.cycleMs : ms % session.cycleMs;
  let index = session.phases.length - 1;
  for (let i = 0; i < session.phases.length; i++) {
    const phase = session.phases[i];
    if (!phase) continue;
    if (within < phase.ms) { index = i; break; }
    within -= phase.ms;
  }
  const phase = session.phases[index];
  if (!phase) throw new Error("A practice session needs at least one phase");
  const phaseRemaining = finished ? 0 : phase.ms - within;
  return { phase, index, round, finished, phaseRemaining, remaining: session.totalMs - ms,
    progress: ms / session.totalMs, phaseProgress: 1 - phaseRemaining / phase.ms,
    scale: circleScale(phase.phase, phaseRemaining / phase.ms) };
}

export function phaseInstruction(p: Practice, phase: PracticePhase, round: number): string {
  if (phase.instruction) return phase.instruction;
  if (p.id === "nadi-shuddhi" && (phase.phase === "in" || phase.phase === "out")) return `${round % 2 ? "Links" : "Rechts"} ${phase.phase === "in" ? "einatmen" : "ausatmen"}`;
  if (p.id === "surya-bhedana") return phase.phase === "in" ? "Rechts einatmen" : phase.phase === "out" ? "Links ausatmen" : phase.label;
  if (p.id === "chandra-bhedana") return phase.phase === "in" ? "Links einatmen" : phase.phase === "out" ? "Rechts ausatmen" : phase.label;
  return phase.label;
}