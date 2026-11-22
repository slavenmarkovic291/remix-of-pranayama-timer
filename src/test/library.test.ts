import { describe, expect, it } from "vitest";
import { practices, filterPractices, practicePreset } from "@/lib/library";

describe("pranayama library", () => {
  it("holds 58 practices with unique ids including Dauthy", () => {
    expect(practices).toHaveLength(58);
    expect(new Set(practices.map((p) => p.id)).size).toBe(58);
    expect(practices.find((p) => p.id === "dauthy")?.name).toBe("Dauthy");
  });
  it("marks exactly the eight HYP kumbhakas", () => {
    expect(practices.filter((p) => p.hypKumbhaka)).toHaveLength(8);
  });
  it("never links risky practices to the timer", () => {
    for (const id of ["murchha", "plavini", "holotropic"]) expect(practices.find((p) => p.id === id)?.timer).toBeUndefined();
  });
  it("filters by category and search", () => {
    expect(filterPractices(practices, { category: "modern" }).every((p) => p.category === "modern")).toBe(true);
    expect(filterPractices(practices, { q: "wechselatmung" }).some((p) => p.id === "nadi-shodhana")).toBe(true);
  });
  it("turns a timer plan into a preset with holds", () => {
    const p = practices.find((x) => x.id === "box-breathing");
    if (!p?.timer) throw new Error("Missing box breathing timer");
    const preset = practicePreset({ ...p, timer: p.timer });
    expect(preset.blocks?.[0]?.timers.map((t) => t.ms)).toEqual([4000, 4000, 4000, 4000]);
    expect(preset.blocks?.[0]?.rounds).toBe(15);
  });
});
