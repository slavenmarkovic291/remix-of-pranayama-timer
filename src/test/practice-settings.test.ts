import { afterEach, expect, it } from "vitest";
import { getPractice } from "@/lib/library";
import { configuredPracticeSession, defaultPracticeSettings, loadPracticeSettings, savePracticeSettings, validPracticeSettings } from "@/lib/practice-settings";
import { sessionAt } from "@/lib/pranayama-session";

function practice(id: string) { const p = getPractice(id); if (!p) throw new Error(id); return p; }
afterEach(() => localStorage.clear());

it("uses all four freely configured phase seconds and skips zero holds", () => {
  const p = practice("box-breathing");
  const s = { ...defaultPracticeSettings(p), inhale: 3, holdIn: 2, exhale: 6, holdOut: 1, rounds: 2 };
  const session = configuredPracticeSession(p, s);
  expect(session.phases.map((p) => p.ms)).toEqual([3000, 2000, 6000, 1000]);
  expect(session.totalMs).toBe(24000);
  expect(sessionAt(session, 5000).phase.phase).toBe("out");
  expect(configuredPracticeSession(p, { ...s, holdIn: 0, holdOut: 0 }).phases.map((p) => p.phase)).toEqual(["in", "out"]);
});
it("times Nadi Shuddhi freely for exactly 4 or 10 minutes without breath deadlines", () => {
  const p = practice("nadi-shuddhi"); const settings = defaultPracticeSettings(p);
  expect(settings.mode).toBe("free");
  expect(configuredPracticeSession(p, settings).totalMs).toBe(240000);
  const session = configuredPracticeSession(p, { ...settings, minutes: 10 });
  expect(session.totalMs).toBe(600000);
  expect(session.paced).toBe(false);
  expect(sessionAt(session, 590000).phase.phase).toBe("neutral");
  expect(sessionAt(session, 600000).finished).toBe(true);
});
it("saves, restores and replaces settings per practice without affecting studio data", () => {
  const p = practice("box-breathing"); const other = practice("nadi-shuddhi");
  const s = { ...defaultPracticeSettings(p), inhale: 2.5, holdIn: 0, minutes: 10 };
  localStorage.setItem("kt.chain", "routine");
  expect(savePracticeSettings(p.id, s)).toBe(true);
  expect(loadPracticeSettings(p)).toEqual(s);
  expect(loadPracticeSettings(other)).toEqual(defaultPracticeSettings(other));
  const updated = { ...s, mode: "free" as const, minutes: 4 };
  expect(savePracticeSettings(p.id, updated)).toBe(true);
  expect(loadPracticeSettings(p)).toEqual(updated);
  expect(localStorage.getItem("kt.chain")).toBe("routine");
});
it("rejects invalid settings and restores defaults for malformed stored values", () => {
  const p = practice("box-breathing"); const s = defaultPracticeSettings(p);
  for (const bad of [{ ...s, inhale: 0 }, { ...s, holdOut: -1 }, { ...s, minutes: NaN }, { ...s, rounds: 1.5 }]) {
    expect(validPracticeSettings(bad)).toBe(false);
    expect(savePracticeSettings(p.id, bad)).toBe(false);
  }
  localStorage.setItem(`prana.practice-times.v1.${p.id}`, '{"inhale":"wrong"}');
  expect(loadPracticeSettings(p)).toEqual(s);
});
it("applies both customized holds to each side of alternate-nostril rounds", () => {
  const p = practice("nadi-shodhana");
  const s = configuredPracticeSession(p, { ...defaultPracticeSettings(p), inhale: 3, holdIn: 1, exhale: 5, holdOut: 2, rounds: 1 });
  expect(s.phases.map((p) => p.ms)).toEqual([3000, 1000, 5000, 2000, 3000, 1000, 5000, 2000]);
  expect(s.totalMs).toBe(22000);
});