import { afterEach, expect, it, vi } from "vitest";
import { playFinale, playStep } from "@/lib/sound";

afterEach(() => vi.unstubAllGlobals());

it("synthesizes Zen bell, temple gong and chimes for steps and finale", () => {
  const frequencies: number[] = [];
  const starts = vi.fn();
  vi.stubGlobal("AudioContext", class {
    state = "running";
    currentTime = 0;
    destination = {};
    createOscillator() {
      const frequency = { set value(value: number) { frequencies.push(value); } };
      return { frequency, type: "sine", connect: (g: unknown) => g, start: starts, stop: vi.fn() };
    }
    createGain() {
      return { gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn() };
    }
  });
  for (const kind of ["zen", "temple", "chimes"] as const) {
    frequencies.length = 0;
    playStep(kind, 0, 0.8);
    expect(frequencies[0]).toBe(kind === "zen" ? 660 : kind === "temple" ? 110 : 784);
    expect(frequencies.length).toBeGreaterThanOrEqual(4);
    frequencies.length = 0;
    playFinale(kind, 0.8);
    expect(frequencies[0]).toBe(kind === "zen" ? 660 : kind === "temple" ? 110 : 784);
    expect(frequencies.length).toBeGreaterThanOrEqual(4);
  }
  expect(starts).toHaveBeenCalledTimes(28);
});