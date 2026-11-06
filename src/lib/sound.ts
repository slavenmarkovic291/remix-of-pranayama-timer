export type SoundMode = "beep" | "rising" | "phase" | "fibonacci";
export type FinaleSound = "gong" | "triad";

export const PHI = (1 + Math.sqrt(5)) / 2;
export const FIB_FREQS = [144, 233, 377, 610, 987];
const PHASE_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

let ctx: AudioContext | null = null;
export function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, gain: number, type: OscillatorType = "sine", attack = 0.01) {
  const c = audio();
  if (!c || gain <= 0) return;
  const t0 = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

/** Frequency for the "rising" mode: climbs a semitone-ish per step, restarts each round. */
export function risingFreq(step: number) {
  return 440 * Math.pow(2, (step * 2) / 12);
}

/** Signal at the end of a timer step. `step` is the index within the round. */
export function playStep(mode: SoundMode, step: number, volume: number) {
  const v = Math.max(0, Math.min(1, volume)) * 0.4;
  if (mode === "beep") {
    [0, 0.25, 0.5].forEach((t) => tone(880, t, 0.2, v, "sine"));
  } else if (mode === "rising") {
    const f = risingFreq(step);
    tone(f, 0, 0.35, v, "triangle");
    tone(f, 0.18, 0.35, v * 0.7, "triangle");
  } else if (mode === "phase") {
    const f = PHASE_NOTES[step % PHASE_NOTES.length]!;
    tone(f, 0, 1.8, v * 0.8, "sine", 0.08);
    tone(f * 2, 0, 1.2, v * 0.15, "sine", 0.08);
  } else {
    const f = FIB_FREQS[step % FIB_FREQS.length]!;
    tone(f, 0, 2.6, v, "sine", 0.05);
    tone(f * PHI, 0, 2.0, v * 0.45, "sine", 0.08);
    tone(f * PHI * PHI, 0, 1.4, v * 0.2, "sine", 0.1);
  }
}

export function playWarn(volume: number) {
  tone(660, 0, 0.09, Math.max(0, Math.min(1, volume)) * 0.25, "square");
}

export function playFinale(kind: FinaleSound, volume: number) {
  const v = Math.max(0, Math.min(1, volume)) * 0.45;
  if (kind === "gong") {
    tone(98, 0, 4, v, "sine", 0.01);
    tone(98 * 2.76, 0, 2.5, v * 0.35, "sine", 0.01);
    tone(98 * 5.4, 0, 1.4, v * 0.15, "sine", 0.01);
  } else {
    const triad = [261.63, 329.63, 392.0];
    triad.forEach((f, i) => tone(f, i * 0.3, 0.8, v * 0.8, "sine", 0.03));
    triad.forEach((f) => tone(f, 1.0, 2.5, v * 0.5, "sine", 0.05));
    tone(523.25, 1.0, 2.5, v * 0.35, "sine", 0.05);
  }
}

export function vibrate(pattern: number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
}
