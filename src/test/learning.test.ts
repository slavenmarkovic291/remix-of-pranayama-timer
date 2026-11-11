import { describe, expect, it } from "vitest";
import { getUnit, practiceSnapshot, units } from "@/lib/learning";

describe("learning foundation", () => {
  it("provides the four interconnected awareness pillars", () => {
    expect(units.map((unit) => unit.id)).toEqual(["body", "breath", "sensory", "inner"]);
    for (const unit of units) {
      expect(unit.connections.every((id) => id !== unit.id && getUnit(id) !== undefined)).toBe(true);
      expect(unit.connections.length).toBeGreaterThan(0);
    }
  });
  it("rejects unknown learning units", () => {
    expect(getUnit("missing-pillar")).toBeUndefined();
  });
  it("prepares finite practice without changing an existing routine or assigning XP", () => {
    const unit = getUnit("breath");
    if (!unit) throw new Error("Missing breath pillar");
    const existing = { name: "My saved routine", blocks: [{ rounds: 7 }] };
    const copy = structuredClone(existing);
    const practice = practiceSnapshot(unit);
    expect(practice.blocks[0]?.timers[0]?.ms).toBe(180000);
    expect(practice.blocks[0]?.rounds).toBe(1);
    expect(practice.infinite).toBe(false);
    expect(existing).toEqual(copy);
    expect(practice).not.toHaveProperty("xp");
  });
});