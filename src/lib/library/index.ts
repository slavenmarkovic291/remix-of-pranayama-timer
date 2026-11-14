import type { CategoryId, Level, Mechanics, Practice, TimerPlan, Tradition } from "./types";
import { nostril, calming } from "./practices-a-b";
import { activating, kumbhaka, traditional, modern } from "./practices-c-f";
import type { Preset } from "../sequence";

export type { Practice } from "./types";
export const practices: Practice[] = [...nostril, ...calming, ...activating, ...kumbhaka, ...traditional, ...modern];
export const getPractice = (id: string) => practices.find((p) => p.id === id);

export const CATEGORIES: { id: CategoryId; letter: string; name: string }[] = [
  { id: "nostril", letter: "A", name: "Nasen- & Wechselatmung" }, { id: "calming", letter: "B", name: "Beruhigend & ausgleichend" },
  { id: "activating", letter: "C", name: "Aktivierend & reinigend" }, { id: "kumbhaka", letter: "D", name: "Kumbhaka & Bandhas" },
  { id: "traditional", letter: "E", name: "Weitere traditionelle Formen" }, { id: "modern", letter: "F", name: "Moderne & klinische Methoden" },
];
export const TRADITIONS: Record<Tradition, string> = { hatha: "Hatha-Yoga-Texte", "yoga-sutra": "Yoga-Sutra", school: "Moderne Yogaschule", modern: "Moderne Methode", clinical: "Klinisch / Forschung" };
export const MECHANICS: Record<Mechanics, string> = { alternate: "Wechselatmung", nasal: "Nasenatmung", mouth: "Mundatmung", segmental: "Abschnittsatmung", retention: "Atemanhalten", sound: "Mit Klang", rapid: "Schnelle Atmung", abdominal: "Bauchtechnik" };
export const LEVELS: Record<Level, string> = { 1: "Einsteiger", 2: "Fortgeschritten", 3: "Erfahren" };
export const KINDS = { pranayama: "Pranayama", kriya: "Kriya (Reinigung)", variation: "Variante", method: "Methode" } as const;

/** Recommended food spacing for an empty stomach, shown on every practice. */
export const FOOD_RULES = [["Mahlzeit", "4 Stunden Abstand"], ["Snack", "2,5 Stunden Abstand"], ["Getränk (außer Wasser)", "1,5 Stunden Abstand"], ["Wasser", "sofort möglich"]] as const;

export const RATIOS = [
  { ratio: "1:1", name: "Gleichmäßig", text: "Ein- und Ausatmung gleich lang. Einstieg für fast alle Techniken, z. B. 4 s ein, 4 s aus." },
  { ratio: "1:2", name: "Verlängerte Ausatmung", text: "Die Ausatmung ist doppelt so lang. Wird mit Beruhigung verbunden, z. B. 4 s ein, 8 s aus." },
  { ratio: "1:2:2", name: "Mit moderatem Anhalten", text: "Einatmen, doppelt so lang halten und ausatmen. Übergang zum klassischen Verhältnis." },
  { ratio: "1:4:2", name: "Klassisches Verhältnis", text: "Einatmen, viermal so lang halten, doppelt so lang ausatmen. In späteren Schulkommentaren verbreitet; nur nach längerer Praxis und mit Anleitung." },
];
export const RATIO_NOTE = "Verhältnisse sind Zahlenmuster, keine eigenständigen Techniken. Sie lassen sich mit vielen Praktiken kombinieren.";

export function filterPractices(list: Practice[], f: { q?: string; category?: string; tradition?: string; level?: string; mechanics?: string }) {
  const q = f.q?.trim().toLowerCase() ?? "";
  return list.filter((p) => (!f.category || p.category === f.category) && (!f.tradition || p.tradition === f.tradition)
    && (!f.level || String(p.level) === f.level) && (!f.mechanics || p.mechanics === f.mechanics)
    && (!q || [p.name, ...p.alt, p.short].some((s) => s.toLowerCase().includes(q))));
}

/** Library practices become a new studio preset; the current routine stays untouched. */
export function practicePreset(p: Practice & { timer: TimerPlan }): Preset {
  const t = p.timer; const id = () => Math.random().toString(36).slice(2, 10);
  const timers = [
    { id: id(), name: "Einatmen", ms: t.inhale * 1000, phase: "in" as const },
    ...(t.holdIn ? [{ id: id(), name: "Halten", ms: t.holdIn * 1000, phase: "holdFull" as const }] : []),
    { id: id(), name: "Ausatmen", ms: t.exhale * 1000, phase: "out" as const },
    ...(t.holdOut ? [{ id: id(), name: "Halten", ms: t.holdOut * 1000, phase: "holdEmpty" as const }] : []),
  ];
  return { name: p.name, signal: "beep", units: ["s"], prep: true, finale: true, blocks: [{ id: id(), name: p.name, rounds: t.rounds, timers, open: true }] };
}

export function addPresetToStudio(preset: Preset) {
  const raw = localStorage.getItem("kt.presets");
  const list: Preset[] = raw ? JSON.parse(raw) : [];
  localStorage.setItem("kt.presets", JSON.stringify([...list, preset]));
}
