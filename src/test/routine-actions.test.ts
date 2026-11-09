import { describe, expect, it } from "vitest";
import { blockJump, combinePreset, MAX_BLOCKS, reorder, resolveTimerSignal, withDefaults, type Block, type TimerCue } from "@/lib/timer";

const block = (id: string): Block => ({ id, name: id, rounds: 7, timers: [{ id: `${id}-timer`, name: "Einatmen", ms: 6000 }] });
const current = withDefaults({ name: "Current", signal: "mute", units: ["s"], blocks: [block("a")] });
const preset = withDefaults({ name: "Preset", signal: "beep", units: ["m", "s"], blocks: [block("b"), block("c")] });

describe("preset combinations", () => {
  it("replaces the entire routine and its settings", () => {
    const result = combinePreset(current, preset, "replace");
    expect(result?.blocks.map((b) => b.name)).toEqual(["b", "c"]);
    expect(result?.signal).toBe("beep");
  });
  it("appends every block while preserving routine settings", () => {
    const result = combinePreset(current, preset, "append");
    expect(result?.blocks.map((b) => b.name)).toEqual(["a", "b", "c"]);
    expect(result?.signal).toBe("mute");
    expect(result?.units).toEqual(["s"]);
  });
  it("prepends every block before existing blocks", () => {
    expect(combinePreset(current, preset, "prepend")?.blocks.map((b) => b.name)).toEqual(["b", "c", "a"]);
  });
  it("gives all imported blocks and timers fresh unique IDs on every import", () => {
    const result = combinePreset(current, preset, "append");
    if (!result) throw new Error("Expected combined routine");
    const twice = combinePreset(result, preset, "append");
    if (!twice) throw new Error("Expected repeated import");
    const imported = twice.blocks.slice(1);
    const ids = imported.flatMap((b) => [b.id, ...b.timers.map((t) => t.id)]);
    expect(new Set(ids).size).toBe(8);
    expect(ids.some((id) => ["b", "c", "b-timer", "c-timer"].includes(id))).toBe(false);
    expect(twice.blocks[0]?.id).toBe("a");
    expect(preset.blocks[0]?.id).toBe("b");
  });
  it("accepts exactly 30 blocks", () => {
    expect(MAX_BLOCKS).toBe(30);
    const large = { ...current, blocks: Array.from({ length: 28 }, (_, i) => block(String(i))) };
    expect(combinePreset(large, preset, "append")?.blocks).toHaveLength(30);
  });
  it("rejects overflow atomically without dropping any block", () => {
    const large = { ...current, blocks: Array.from({ length: 29 }, (_, i) => block(String(i))) };
    expect(combinePreset(large, preset, "append")).toBeNull();
    expect(combinePreset(large, preset, "prepend")).toBeNull();
    expect(large.blocks).toHaveLength(29);
  });
  it("sorts saved presets up and down without modifying the originals", () => {
    const items = [current, preset];
    expect(reorder(items, 1, -1)).toEqual([preset, current]);
    expect(reorder(items, 0, 1)).toEqual([preset, current]);
    expect(reorder(items, 0, -1)).toEqual(items);
    expect(items).toEqual([current, preset]);
  });
});

describe("block navigation", () => {
  const blocks = [block("a"), { ...block("empty"), timers: [] }, block("b")];
  it("jumps to the next populated block at round 1 timer 1", () => {
    expect(blockJump(blocks, 0, 1)).toEqual({ block: 2, round: 1, index: 0 });
  });
  it("jumps to the previous block at round 1 timer 1", () => {
    expect(blockJump(blocks, 2, -1)).toEqual({ block: 0, round: 1, index: 0 });
  });
  it("repeats the current block from round 1 timer 1", () => {
    expect(blockJump(blocks, 2, 0)).toEqual({ block: 2, round: 1, index: 0 });
  });
  it("does not wrap outside the routine", () => {
    expect(blockJump(blocks, 0, -1)).toBeNull();
    expect(blockJump(blocks, 2, 1)).toBeNull();
  });
});

describe("per-timer start signals", () => {
  it("standard inherits both global signal and cue", () => {
    expect(resolveTimerSignal({ signal: "both", cue: "voice" }, { ...block("a").timers[0], id: "x", name: "x", ms: 6000, cue: "standard" })).toEqual({ tone: false, voice: true, vibration: true });
    expect(resolveTimerSignal({ signal: "mute", cue: "both" })).toEqual({ tone: false, voice: false, vibration: false });
  });
  it.each<[TimerCue, boolean, boolean]>([["tone", true, false], ["voice", false, true], ["both", true, true], ["mute", false, false]])("%s overrides routine settings", (cue, tone, voice) => {
    expect(resolveTimerSignal({ signal: "mute", cue: "tone" }, { id: "t", name: "x", ms: 1000, cue })).toEqual({ tone, voice, vibration: false });
  });
});