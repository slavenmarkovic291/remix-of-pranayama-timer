import { describe, expect, it } from "vitest";
import { circleScale, phaseFromName, resolvePhase } from "@/lib/breath";
const t = (name: string, phase?: any) => ({ id: name + Math.random(), name, ms: 1000, phase });
describe("breath circle", () => {
  it("detects phases from names", () => {
    expect(phaseFromName("Einatmen")).toBe("in");
    expect(phaseFromName("Exhale")).toBe("out");
    expect(phaseFromName("Halten")).toBe("hold");
    expect(phaseFromName("Sukha kriya")).toBe("neutral");
  });
  it("hold after inhale stays full, after exhale stays empty", () => {
    const ts = [t("Ein"), t("Halten"), t("Aus"), t("Halt")];
    expect(resolvePhase(ts, 1)).toBe("holdFull");
    expect(resolvePhase(ts, 3)).toBe("holdEmpty");
  });
  it("manual phase overrides the name", () => {
    expect(resolvePhase([t("Ein", "out")], 0)).toBe("out");
  });
  it("inhale grows from 0 to full, exhale shrinks", () => {
    expect(circleScale("in", 1)).toBe(0);
    expect(circleScale("in", 0)).toBe(1);
    expect(circleScale("out", 1)).toBe(1);
    expect(circleScale("out", 0)).toBe(0);
  });
});
