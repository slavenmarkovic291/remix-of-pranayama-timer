import { describe, expect, it } from "vitest";
import { prepareSequence, sequenceNumber, type Preset } from "@/lib/sequence";

const preset = (name: string, number?: number): Preset => ({ name, sequenceNumber: number, signal: "mute", units: ["s"], rounds: 2, timers: [{ id: name, name, ms: 1000 }] });
describe("preset sequences", () => {
  it("accepts integer positions 1 through 20 and allows clearing", () => {
    expect(sequenceNumber(1)).toBe(1);
    expect(sequenceNumber(20)).toBe(20);
    for (const value of [0, 21, 1.5, undefined, ""]) expect(sequenceNumber(value)).toBeUndefined();
  });
  it("plays numbered practices in numeric order, skipping unnumbered practices", () => {
    expect(prepareSequence([preset("third", 20), preset("skip"), preset("first", 1)]).practices.map((p) => p.name)).toEqual(["first", "third"]);
  });
  it("keeps each practice's blocks, rounds and settings without modifying saved data", () => {
    const saved = { ...preset("first", 1), infinite: true, prep: true, sound: "zen" as const };
    const result = prepareSequence([saved]).practices[0];
    expect(result?.infinite).toBe(false);
    expect(result?.blocks[0]?.rounds).toBe(2);
    expect(result?.sound).toBe("zen");
    expect(saved.infinite).toBe(true);
    expect(saved.blocks).toBeUndefined();
  });
  it("rejects duplicate positions instead of selecting an arbitrary order", () => {
    const result = prepareSequence([preset("a", 1), preset("b", 1)]);
    expect(result.practices).toEqual([]);
    expect(result.error).not.toBe("");
  });
  it("rejects empty practices atomically", () => {
    expect(prepareSequence([{ ...preset("empty", 1), timers: [] }]).practices).toEqual([]);
  });
});