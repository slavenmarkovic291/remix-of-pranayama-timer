export type SoundMode = "beep" | "rising" | "phase" | "fibonacci" | "bowl" | "wood" | "zen" | "temple" | "chimes";
export type FinaleSound = "gong" | "bowl" | "triad" | "chord" | "crystal" | "zen" | "temple" | "chimes";
export const STEP_SOUNDS: [SoundMode, string][] = [["beep", "Standard-Beep"], ["rising", "Aufsteigend"], ["phase", "Phasen-Melodie"], ["fibonacci", "Fibonacci-Resonanz"], ["bowl", "Kleine Klangschale"], ["wood", "Holzblock"], ["zen", "Zen-Glocke"], ["temple", "Tempel-Gong"], ["chimes", "Windspiel"]];
export const FINALE_SOUNDS: [FinaleSound, string][] = [["gong", "Tiefer Gong"], ["bowl", "Klangschale"], ["triad", "Dreiklang"], ["chord", "Akkord"], ["crystal", "Kristall"], ["zen", "Zen-Glocke"], ["temple", "Tempel-Gong"], ["chimes", "Windspiel"]];

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

function meditationSound(kind: "zen" | "temple" | "chimes", gain: number, duration: number) {
  if (kind === "zen") {
    [1, 2.01, 2.76, 4.07].forEach((ratio, i) => tone(660 * ratio, 0, duration / (1 + i * 0.3), gain / (1 + i * 2), "sine", 0.008));
  } else if (kind === "temple") {
    [1, 1.48, 2.76, 4.92].forEach((ratio, i) => tone(110 * ratio, 0, duration / (1 + i * 0.25), gain / (1 + i * 2), "sine", 0.035));
    tone(112, 0, duration, gain * 0.3, "sine", 0.035);
  } else {
    [784, 1046.5, 1174.7, 1568, 1318.5].forEach((f, i) => tone(f, i * 0.19, duration * 0.65, gain * 0.35, "sine", 0.006));
  }
}

/** Signal at the start of a timer step. `step` is the index within the round. */
export function playStep(mode: SoundMode, step: number, volume: number) {
  const v = Math.max(0, Math.min(1, volume)) * 0.4;
  if (mode === "beep") {
    [0, 0.25, 0.5].forEach((t) => tone(880, t, 0.2, v, "sine"));
  } else if (mode === "rising") {
    const f = risingFreq(step);
    tone(f, 0, 0.35, v, "triangle");
    tone(f, 0.18, 0.35, v * 0.7, "triangle");
  } else if (mode === "phase") {
    const f = PHASE_NOTES[step % PHASE_NOTES.length] ?? 261.63;
    tone(f, 0, 1.8, v * 0.8, "sine", 0.08);
    tone(f * 2, 0, 1.2, v * 0.15, "sine", 0.08);
  } else if (mode === "bowl") {
    tone(528, 0, 3, v * 0.8, "sine", 0.02);
    tone(528 * 2.71, 0, 2, v * 0.25, "sine", 0.02);
    tone(531, 0, 3, v * 0.4, "sine", 0.02);
  } else if (mode === "wood") {
    tone(1200, 0, 0.08, v, "triangle", 0.002);
    tone(800, 0, 0.12, v * 0.6, "sine", 0.002);
  } else if (mode === "zen" || mode === "temple" || mode === "chimes") {
    meditationSound(mode, v * 0.8, 3);
  } else {
    const f = FIB_FREQS[step % FIB_FREQS.length] ?? 144;
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
  } else if (kind === "bowl") {
    ([[220, 1], [220 * 2.71, 0.4], [220 * 5.1, 0.15], [222.5, 0.5]] as [number, number][]).forEach(([f, g]) => tone(f, 0, 6, v * g, "sine", 0.03));
  } else if (kind === "chord") {
    [196, 246.94, 293.66, 369.99, 440].forEach((f) => tone(f, 0, 4, v * 0.35, "sine", 0.15));
  } else if (kind === "crystal") {
    [1318.5, 1567.98, 2093, 2637].forEach((f, i) => tone(f, i * 0.12, 2.5, v * 0.3, "sine", 0.005));
    tone(2093 * 2.4, 0.4, 1.5, v * 0.1, "sine", 0.005);
  } else if (kind === "zen" || kind === "temple" || kind === "chimes") {
    meditationSound(kind, v, 6);
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

export function speak(text: string, volume: number) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
  const s = window.speechSynthesis;
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "de-DE";
  u.volume = Math.max(0, Math.min(1, volume));
  const de = s.getVoices().find((x) => x.lang.toLowerCase().startsWith("de") && x.localService);
  if (de) u.voice = de;
  s.speak(u);
}
