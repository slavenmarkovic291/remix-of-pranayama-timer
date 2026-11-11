import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuidedPractice } from "@/components/prana/GuidedPractice";
import { getUnit } from "@/lib/learning";
import { playFinale, playStep } from "@/lib/sound";

vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <span>{children}</span> }));
vi.mock("@/lib/sound", () => ({ audio: vi.fn(), playStep: vi.fn(), playFinale: vi.fn() }));
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe("guided practice", () => {
  it("starts, pauses, resumes and finishes once without overwriting saved timer data", () => {
    let now = 0;
    let id = 0;
    const frames = new Map<number, FrameRequestCallback>();
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++id, callback); return id; });
    vi.stubGlobal("cancelAnimationFrame", (key: number) => frames.delete(key));
    const routine = JSON.stringify({ name: "Saved routine", rounds: 7 });
    const presets = JSON.stringify([{ name: "Saved practice", sequenceNumber: 4 }]);
    localStorage.setItem("kt.chain", routine); localStorage.setItem("kt.presets", presets);
    const unit = getUnit("body");
    if (!unit) throw new Error("Missing body unit");
    render(<GuidedPractice unit={unit}/>);
    const tick = (time: number) => act(() => { now = time; const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((callback) => callback(now)); });
    fireEvent.click(screen.getByRole("button", { name: "Praxis starten" }));
    expect(playStep).toHaveBeenCalledTimes(1);
    tick(60000);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(frames.size).toBe(0);
    tick(90000);
    fireEvent.click(screen.getByRole("button", { name: "Fortsetzen" }));
    tick(150000);
    expect(screen.getByRole("status")).toHaveTextContent("Praxis beendet");
    expect(playFinale).toHaveBeenCalledExactlyOnceWith("bowl", 0.35);
    expect(playStep).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("kt.chain")).toBe(routine);
    expect(localStorage.getItem("kt.presets")).toBe(presets);
  });
});