import { firstPos, withDefaults, type Chain, type FullChain } from "./timer";

export interface Preset extends Chain { sequenceNumber?: number | undefined }
export function sequenceNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 20 ? value : undefined;
}

/** Validate before playback; duplicate positions must not silently pick a practice. */
export function prepareSequence(presets: Preset[]): { practices: FullChain[]; error: string } {
  const numbered = presets.filter((p) => sequenceNumber(p.sequenceNumber) !== undefined)
    .sort((a, b) => (a.sequenceNumber ?? 0) - (b.sequenceNumber ?? 0));
  const positions = numbered.map((p) => p.sequenceNumber);
  if (new Set(positions).size !== positions.length) return { practices: [], error: "Jede Sequenz-Nummer darf nur einmal vergeben sein." };
  const practices = numbered.map((p) => withDefaults({ ...p, infinite: false }));
  const empty = practices.find((p) => !firstPos(p.blocks) || !p.blocks.some((b) => b.timers.some((t) => t.ms > 0)));
  if (empty) return { practices: [], error: `„${empty.name}“ enthält keine abspielbaren Timer.` };
  return { practices, error: "" };
}