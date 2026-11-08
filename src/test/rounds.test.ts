import { describe, it, expect } from "vitest";
import { nextStep } from "@/lib/timer";

describe("rounds", () => {
  it("moves to the next step within a round", () => {
    expect(nextStep(0, 1, 3, 7, false)).toEqual({ index: 1, round: 1 });
  });
  it("wraps seamlessly to round 2 after the last step", () => {
    expect(nextStep(2, 1, 3, 7, false)).toEqual({ index: 0, round: 2 });
  });
  it("stops after the very last round (7 of 7)", () => {
    expect(nextStep(2, 7, 3, 7, false)).toBeNull();
  });
  it("never stops in endless mode", () => {
    expect(nextStep(2, 999, 3, 1, true)).toEqual({ index: 0, round: 1000 });
  });
});

import { nextPos, withDefaults } from "@/lib/timer";
describe("blocks", () => {
  const blocks = withDefaults({
    name: "x", signal: "mute", units: ["s"],
    blocks: [
      { id: "a", name: "B1", rounds: 7, timers: [{ id: "1", name: "", ms: 6000 }, { id: "2", name: "", ms: 3000 }] },
      { id: "b", name: "B2", rounds: 1, timers: [{ id: "3", name: "", ms: 210000 }] },
    ],
  }).blocks;
  it("block 1 repeats until round 7", () => {
    expect(nextPos(blocks, { block: 0, round: 6, index: 1 }, false)).toEqual({ block: 0, round: 7, index: 0 });
  });
  it("after round 7 of block 1, block 2 starts with round 1", () => {
    expect(nextPos(blocks, { block: 0, round: 7, index: 1 }, false)).toEqual({ block: 1, round: 1, index: 0 });
  });
  it("routine ends after block 2's single round", () => {
    expect(nextPos(blocks, { block: 1, round: 1, index: 0 }, false)).toBeNull();
  });
  it("legacy chains migrate into one block", () => {
    const c = withDefaults({ name: "x", signal: "mute", units: ["s"], rounds: 3, timers: [{ id: "1", name: "", ms: 1 }] });
    expect(c.blocks).toHaveLength(1);
    expect(c.blocks[0]!.rounds).toBe(3);
  });
});
