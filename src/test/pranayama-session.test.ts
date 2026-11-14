import { describe, expect, it } from "vitest";
import { getPractice } from "@/lib/library";
import { makeSession, phaseInstruction, roundsForMinutes, sessionAt } from "@/lib/pranayama-session";

function practice(id: string) { const p = getPractice(id); if (!p) throw new Error(id); return p; }
describe("direct pranayama sessions", () => {
  it("plays inhale, full hold, exhale and empty hold in that order", () => {
    const s = makeSession(practice("box-breathing"), 2);
    expect(s.phases.map((p) => p.phase)).toEqual(["in", "holdFull", "out", "holdEmpty"]);
    expect(sessionAt(s, 4000).phase.phase).toBe("holdFull");
    expect(sessionAt(s, 8000).phase.phase).toBe("out");
    expect(sessionAt(s, 12000).phase.phase).toBe("holdEmpty");
    expect(sessionAt(s, 16000).round).toBe(2);
    expect(sessionAt(s, 32000).finished).toBe(true);
    expect(sessionAt(s, 32000).remaining).toBe(0);
  });
  it("grows and appears on inhale, stays full, shrinks on exhale and disappears while empty", () => {
    const s = makeSession(practice("box-breathing"));
    expect(sessionAt(s, 0).scale).toBe(0);
    expect(sessionAt(s, 2000).scale).toBe(.5);
    expect(sessionAt(s, 5000).scale).toBe(1);
    expect(sessionAt(s, 10000).scale).toBe(.5);
    expect(sessionAt(s, 13000).scale).toBe(0);
  });
  it("uses complete cycles for 3, 7 and 10 minute choices", () => {
    const s = makeSession(practice("box-breathing"));
    expect(roundsForMinutes(s, 3)).toBe(12);
    expect(roundsForMinutes(s, 7)).toBe(27);
    expect(roundsForMinutes(s, 10)).toBe(38);
  });
  it("keeps Nadi Shuddhi on the same nostril until exhalation completes", () => {
    const p = practice("nadi-shuddhi"); const s = makeSession(p);
    expect(s.totalMs).toBe(240000);
    expect(phaseInstruction(p, sessionAt(s, 0).phase, 1)).toBe("Links einatmen");
    expect(phaseInstruction(p, sessionAt(s, 5000).phase, 1)).toBe("Links ausatmen");
    expect(phaseInstruction(p, sessionAt(s, 10000).phase, 2)).toBe("Rechts einatmen");
  });
  it("uses two breaths for one complete Nadi Shodhana round", () => {
    const s = makeSession(practice("nadi-shodhana"), 1);
    expect(s.phases.map((p) => p.instruction)).toEqual(["Links einatmen", "Rechts ausatmen", "Rechts einatmen", "Links ausatmen"]);
    expect(s.totalMs).toBe(16000);
  });
  it("does not prescribe a paced inhale for rapid or unconfigured practices", () => {
    const p = practice("kapalabhati");
    const s = makeSession(p);
    expect(s.paced).toBe(false);
    expect(s.phases[0]?.phase).toBe("neutral");
    expect(s.totalMs).toBe(180000);
  });
});