import { afterEach, expect, it } from "vitest";
import { getPractice } from "@/lib/library";
import { librarySequenceAt, loadLibraryOrder, prepareLibrarySessions, saveLibraryOrder } from "@/lib/library-sequence";
import { defaultPracticeSettings, savePracticeSettings } from "@/lib/practice-settings";
import { reorder } from "@/lib/timer";
afterEach(() => localStorage.clear());
it("persists user order, supports repeats and rejects unknown practices atomically", () => {
  const order = reorder(["nadi-shuddhi", "box-breathing", "nadi-shuddhi"], 1, -1);
  expect(order).toEqual(["box-breathing", "nadi-shuddhi", "nadi-shuddhi"]);
  expect(saveLibraryOrder(order)).toBe(true);
  expect(loadLibraryOrder()).toEqual(order);
  expect(saveLibraryOrder(["unknown"])).toBe(false);
  expect(loadLibraryOrder()).toEqual(order);
});
it("uses saved per-practice timing and transitions in chosen order at exact boundaries", () => {
  const p = getPractice("box-breathing"); if (!p) throw new Error("Missing practice");
  savePracticeSettings(p.id, { ...defaultPracticeSettings(p), rounds: 1 });
  const entries = prepareLibrarySessions(["box-breathing", "nadi-shuddhi"]);
  expect(entries[0]?.session.totalMs).toBe(16000);
  expect(entries[1]?.session.totalMs).toBe(240000);
  expect(librarySequenceAt(entries, 15999).practice.id).toBe("box-breathing");
  expect(librarySequenceAt(entries, 16000).practice.id).toBe("nadi-shuddhi");
  expect(librarySequenceAt(entries, 16000).localElapsed).toBe(0);
  expect(librarySequenceAt(entries, 256000).localElapsed).toBe(240000);
  savePracticeSettings(p.id, { ...defaultPracticeSettings(p), rounds: 2 });
  expect(entries[0]?.session.totalMs).toBe(16000);
});