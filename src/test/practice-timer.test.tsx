import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PracticeTimer } from "@/components/library/PracticeTimer";
import { getPractice } from "@/lib/library";
import { playStep, playFinale } from "@/lib/sound";

vi.mock("@/lib/sound", async (original) => {
  const source = await original<typeof import("@/lib/sound")>();
  return { ...source, audio: vi.fn(), playStep: vi.fn(), playFinale: vi.fn(), speak: vi.fn(), vibrate: vi.fn() };
});
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

it("starts directly, pauses and resumes without restarting, then finishes once without changing studio data", () => {
  let now = 0; let id = 0;
  const frames = new Map<number, FrameRequestCallback>();
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++id, callback); return id; });
  vi.stubGlobal("cancelAnimationFrame", (key: number) => frames.delete(key));
  localStorage.setItem("kt.chain", "saved routine"); localStorage.setItem("kt.presets", "saved presets");
  const p = getPractice("box-breathing"); if (!p) throw new Error("Missing practice");
  render(<PracticeTimer practice={p}/>);
  fireEvent.change(screen.getByLabelText("Eigene Rundenzahl"), { target: { value: "1" } });
  fireEvent.click(screen.getByRole("button", { name: "Praxis starten · 0:16" }));
  expect(playStep).toHaveBeenCalledExactlyOnceWith("wood", 0, .35);
  const tick = (time: number) => act(() => { now = time; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((callback) => callback(now)); });
  tick(2000);
  fireEvent.click(screen.getByRole("button", { name: "Praxis pausieren" }));
  expect(frames.size).toBe(0);
  tick(5000);
  fireEvent.click(screen.getByRole("button", { name: "Praxis fortsetzen" }));
  tick(7000);
  expect(playStep).toHaveBeenLastCalledWith("wood", 1, .35);
  tick(19000);
  expect(playFinale).toHaveBeenCalledExactlyOnceWith("bowl", .35);
  tick(20000);
  expect(playFinale).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem("kt.chain")).toBe("saved routine");
  expect(localStorage.getItem("kt.presets")).toBe("saved presets");
});