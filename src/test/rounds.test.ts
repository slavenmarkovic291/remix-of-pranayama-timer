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
