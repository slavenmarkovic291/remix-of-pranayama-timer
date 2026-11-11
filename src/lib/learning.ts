import { withDefaults, type FullChain } from "./timer";

export type PillarId = "body" | "breath" | "sensory" | "inner";
export interface LearningUnit {
  id: PillarId;
  number: string;
  name: string;
  english: string;
  title: string;
  description: string;
  duration: number;
  idea: string;
  example: string;
  perspective: string;
  context: string;
  deeper: string;
  question: string;
  instructions: string[];
  reflection: string;
  connections: PillarId[];
}

export const units: LearningUnit[] = [
  {
    id: "body", number: "01", name: "Körper", english: "Body awareness", title: "Den Boden spüren",
    description: "Ankommen. Kontakt wahrnehmen. Stabilität entdecken.", duration: 2,
    idea: "Bevor du eine Haltung veränderst, kannst du wahrnehmen, wie du gerade sitzt.",
    example: "Beim Warten auf den Bus: Wie verteilt sich dein Gewicht auf beide Füße?",
    perspective: "Direkte Beobachtung", context: "Diese Einheit ist eine Wahrnehmungsübung, keine Bewertung deiner Haltung und keine medizinische Empfehlung.",
    deeper: "Körperwahrnehmung ist ein Ausgangspunkt für Haltung und Bewegung. Im Yoga wird eine stabile, angenehme Haltung als Grundlage der Praxis beschrieben (Yoga-Sutra 2.46). Das ist ein traditioneller Bezug, kein wissenschaftlicher Wirksamkeitsnachweis.",
    question: "Wo spürst du Kontakt — und wo bemerkst du gerade wenig?",
    instructions: ["Setze dich bequem hin. Die Füße dürfen den Boden berühren.", "Bemerke die Kontaktflächen an Füßen, Sitz und Händen.", "Lass den Atem natürlich fließen. Du musst nichts korrigieren."],
    reflection: "Hat sich dein Kontakt zum Boden verändert, als du auch den Atem bemerkt hast?",
    connections: ["breath", "inner"],
  },
  {
    id: "breath", number: "02", name: "Atem", english: "Breath awareness", title: "Dem Atem begegnen",
    description: "Den eigenen Rhythmus kennenlernen, ohne ihn zu formen.", duration: 3,
    idea: "Atembeobachtung beginnt mit dem vorhandenen Atem, nicht mit einem idealen Rhythmus.",
    example: "Nach dem Treppensteigen klingt dein Atem anders als im Sitzen. Was bemerkst du?",
    perspective: "Praxis & Beobachtung", context: "Diese Einstiegsübung verändert den Atem nicht und enthält weder Atempausen noch forcierte Atemzüge.",
    deeper: "Pranayama bezeichnet in yogischen Traditionen verschiedene Atempraktiken. Traditionelle Begriffe wie Prana sind keine wissenschaftlich gemessenen Energiegrößen. Atem und körperliche Reaktionen lassen sich beobachten, ohne daraus eine Wirkung für jede Person abzuleiten.",
    question: "Wo lässt sich dein Atem heute am deutlichsten wahrnehmen?",
    instructions: ["Finde eine angenehme Sitzposition und lasse die Schultern locker.", "Beobachte den natürlichen Atem an Nase, Brust oder Bauch.", "Wenn du abschweifst, kehre ohne Druck zur nächsten Atembewegung zurück."],
    reflection: "Hast du den Atem nur beobachtet — oder unbemerkt versucht, ihn zu verändern?",
    connections: ["body", "sensory"],
  },
  {
    id: "sensory", number: "03", name: "Sinne", english: "Sensory awareness", title: "Hören, ohne zu suchen",
    description: "Nahe und ferne Geräusche. Einen Moment einfach zuhören.", duration: 2,
    idea: "Du kannst einen Klang bemerken, bevor du ihm einen Namen gibst.",
    example: "Ein Geräusch vor dem Fenster: Hörst du zuerst den Klang oder denkst du sofort an seine Quelle?",
    perspective: "Persönliche Untersuchung", context: "Hier hörst du auf deine Umgebung. Es werden keine versteckten Testtöne abgespielt und deine Wahrnehmung wird nicht bewertet.",
    deeper: "Wahrnehmen und Benennen liegen im Alltag oft eng beieinander. Diese Übung lädt dazu ein, diesen Übergang zu untersuchen. Sie behauptet weder eine gesteigerte Hörleistung noch eine bestimmte spirituelle Erfahrung.",
    question: "Was hörst du, wenn du für einen Moment nicht nach der Quelle suchst?",
    instructions: ["Bleibe bequem sitzen. Die Augen können offen oder geschlossen sein.", "Lausche den Geräuschen deiner Umgebung, nah und fern.", "Bemerke auch Pausen. Du brauchst keinen besonderen Klang zu finden."],
    reflection: "Welcher Klang hat eine Erinnerung, einen Gedanken oder ein Gefühl ausgelöst?",
    connections: ["inner", "body"],
  },
  {
    id: "inner", number: "04", name: "Innenwelt", english: "Inner awareness", title: "Gedanken bemerken",
    description: "Nicht alles lösen. Erst einmal beobachten, was auftaucht.", duration: 2,
    idea: "Ein auftauchender Gedanke muss nicht sofort beantwortet werden.",
    example: "Du erinnerst dich an eine offene Aufgabe. Was geschieht im Körper, bevor du handelst?",
    perspective: "Philosophische Perspektive", context: "Selbstbeobachtung ist eine Einladung zur Untersuchung. Es gibt keine vorgeschriebene Antwort und kein zu erreichendes Bewusstseinsniveau.",
    deeper: "Selbsterforschung fragt nach unserer Beziehung zu Gedanken, Gefühlen und Identifikation. Unterschiedliche philosophische und yogische Traditionen geben darauf unterschiedliche Antworten. Diese Einheit lässt deine eigene Beobachtung offen; sie ersetzt keine psychotherapeutische Unterstützung.",
    question: "Kannst du einen Gedanken bemerken, ohne ihm gleich weiter zu folgen?",
    instructions: ["Orientiere dich kurz im Raum und spüre deine Kontaktflächen.", "Bemerke, welche Gedanken oder Gefühle gerade auftauchen.", "Wenn es unangenehm wird, öffne die Augen und richte die Aufmerksamkeit wieder auf den Raum."],
    reflection: "Wie hängen die Gedanken, die du bemerkt hast, mit deinem Körpergefühl zusammen?",
    connections: ["body", "breath"],
  },
];

export function getUnit(id: string): LearningUnit | undefined {
  return units.find((unit) => unit.id === id);
}

/** Guided sessions are separate snapshots, never replacing the user's saved studio routine. */
export function practiceSnapshot(unit: LearningUnit): FullChain {
  return withDefaults({
    name: unit.title, units: ["m", "s"], signal: "beep", prep: false, infinite: false,
    blocks: [{ id: `practice-${unit.id}`, name: unit.name, rounds: 1, timers: [{ id: unit.id, name: unit.title, ms: unit.duration * 60000 }] }],
    sound: "bowl", finaleSound: "bowl", volume: 0.35,
  });
}

export function pageHead(title: string, description: string) {
  return { meta: [
    { title }, { name: "description", content: description },
    { property: "og:title", content: title }, { property: "og:description", content: description },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] };
}