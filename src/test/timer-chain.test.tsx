import { StrictMode, type ComponentType } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/index";
import { playStep, speak, playFinale } from "@/lib/sound";

vi.mock("@/lib/sound", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/sound")>(),
  audio: vi.fn(), playStep: vi.fn(), speak: vi.fn(), playFinale: vi.fn(),
}));

const TimerApp = Route.options.component as ComponentType;

describe("sequential timer durations in StrictMode", () => {
  let now = 0;
  let frameId = 0;
  let frames: Map<number, FrameRequestCallback>;

  beforeEach(() => {
    now = 0;
    frames = new Map();
    vi.stubGlobal("ResizeObserver", class {
      observe() {}
      unobserve() {}
      disconnect() {}
    });
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.set(++frameId, callback);
      return frameId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
    localStorage.setItem("kt.chain", JSON.stringify({
      name: "Duration regression", signal: "mute", units: ["s"], prep: false,
      timers: [
        { id: "first", name: "First", ms: 1000 },
        { id: "second", name: "Second", ms: 13000 },
        { id: "third", name: "Third", ms: 8000 },
      ],
    }));
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function tick(time: number) {
    act(() => {
      now = time;
      const pending = [...frames.values()];
      frames.clear();
      pending.forEach((callback) => callback(now));
    });
  }

  function startChain() {
    const result = render(<StrictMode><TimerApp /></StrictMode>);
    fireEvent.click(screen.getByRole("button", { name: /^Start$/ }));
    return result.container.querySelector(".tabular-nums");
  }

  it("runs independent numbered practices with one preparation and one finale, retaining saved data", () => {
    const presets = [
      { name: "Second practice", sequenceNumber: 2, signal: "beep", prep: true, finale: true, finaleSound: "zen", units: ["s"], timers: [{ id: "second", name: "Second step", ms: 2000 }] },
      { name: "Skipped", signal: "mute", units: ["s"], timers: [{ id: "skip", name: "Skipped step", ms: 5000 }] },
      { name: "First practice", sequenceNumber: 1, signal: "beep", prep: true, finale: true, units: ["s"], rounds: 2, timers: [{ id: "first", name: "First step", ms: 1000 }] },
    ];
    localStorage.setItem("kt.presets", JSON.stringify(presets));
    const result = render(<StrictMode><TimerApp /></StrictMode>);
    fireEvent.click(screen.getByRole("button", { name: "Sequenz starten" }));
    const countdown = result.container.querySelector(".tabular-nums");
    expect(screen.getByText("Praktik 1/2: First practice")).toBeInTheDocument();
    tick(3000);
    expect(countdown?.textContent).toBe("1");
    tick(4000);
    expect(screen.getByText(/Runde 2 von 2/)).toBeInTheDocument();
    tick(5000);
    expect(screen.getByText("Praktik 2/2: Second practice")).toBeInTheDocument();
    expect(countdown?.textContent).toBe("2");
    expect(playFinale).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /^Vollbild$/ }).parentElement?.querySelector("button") ?? screen.getAllByRole("button", { name: "Vollbild" })[0]);
    expect(screen.getAllByText("Praktik 2/2: Second practice").length).toBeGreaterThanOrEqual(1);
    tick(7000);
    expect(playFinale).toHaveBeenCalledExactlyOnceWith("zen", 0.8);
    expect(JSON.parse(localStorage.getItem("kt.presets") ?? "[]")).toEqual(presets);
  });

  it("persists sequence numbers and keeps unnumbered presets individually playable", () => {
    localStorage.setItem("kt.presets", JSON.stringify([{ name: "Solo", signal: "mute", prep: false, units: ["s"], timers: [{ id: "solo", name: "Solo step", ms: 1000 }] }]));
    render(<StrictMode><TimerApp /></StrictMode>);
    fireEvent.change(screen.getByRole("spinbutton", { name: "Sequenz-Nummer Solo" }), { target: { value: "20" } });
    expect(JSON.parse(localStorage.getItem("kt.presets") ?? "[]")[0].sequenceNumber).toBe(20);
    fireEvent.click(screen.getByRole("button", { name: "Sequenz-Nummer entfernen Solo" }));
    expect(JSON.parse(localStorage.getItem("kt.presets") ?? "[]")[0].sequenceNumber).toBeUndefined();
    fireEvent.click(screen.getByRole("button", { name: "Einzeln starten" }));
    expect(screen.getByText("Solo step")).toBeInTheDocument();
    tick(1000);
    expect(screen.getByText("Fertig ✓")).toBeInTheDocument();
  });

  it("runs the second timer for 13 seconds, not 26", () => {
    const countdown = startChain();
    tick(1000);
    expect(countdown?.textContent).toBe("13");
    tick(13000);
    expect(countdown?.textContent).toBe("1");
    tick(14000);
    expect(screen.getByText(/Timer 3 \/ 3/)).toBeInTheDocument();
  });

  it("runs the third timer for 8 seconds, not 16", () => {
    const countdown = startChain();
    tick(1000);
    tick(14000);
    expect(countdown?.textContent).toBe("8");
    tick(21000);
    expect(countdown?.textContent).toBe("1");
    tick(22000);
    expect(countdown?.textContent).toBe("0");
    expect(screen.getByText("Fertig ✓")).toBeInTheDocument();
    expect(frames.size).toBe(0);
  });

  it("runs the 3s prep only once, then repeats rounds seamlessly", () => {
    localStorage.setItem("kt.chain", JSON.stringify({
      name: "R", signal: "mute", units: ["s"], prep: true, rounds: 2,
      timers: [{ id: "a", name: "Ein", ms: 2000 }, { id: "b", name: "Aus", ms: 3000 }],
    }));
    const countdown = startChain();
    tick(500);
    expect(screen.getByText("Bereit machen…")).toBeInTheDocument();
    tick(3000);
    expect(countdown?.textContent).toBe("2");
    tick(8000); // round 1 ends at 3000+5000
    expect(screen.getByText(/Runde 2 von 2/)).toBeInTheDocument();
    expect(countdown?.textContent).toBe("2"); // no prep between rounds
    tick(13000);
    expect(screen.getByText("Fertig ✓")).toBeInTheDocument();
  });

  function storeBlocks() {
    localStorage.setItem("kt.chain", JSON.stringify({
      name: "Navigation", signal: "mute", units: ["s"], prep: false,
      blocks: [
        { id: "a", name: "A", rounds: 3, timers: [{ id: "a1", name: "First", ms: 2000 }, { id: "a2", name: "Second", ms: 3000 }] },
        { id: "b", name: "B", rounds: 2, timers: [{ id: "b1", name: "Third", ms: 4000 }] },
      ],
    }));
  }

  it("running block jumps and repeat reset round, step and full duration without pausing", () => {
    storeBlocks();
    const countdown = startChain();
    tick(6000);
    fireEvent.click(screen.getByRole("button", { name: "Nächster Block" }));
    expect(countdown?.textContent).toBe("4");
    tick(10000);
    expect(screen.getByText(/Runde 2 von 2/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aktuellen Block wiederholen" }));
    expect(screen.getByText(/Runde 1 von 2/)).toBeInTheDocument();
    expect(countdown?.textContent).toBe("4");
    fireEvent.click(screen.getByRole("button", { name: "Vorheriger Block" }));
    expect(screen.getByText(/Runde 1 von 3/)).toBeInTheDocument();
    expect(countdown?.textContent).toBe("2");
    tick(12000);
    expect(countdown?.textContent).toBe("3");
  });

  it("paused block jump stays paused and resumes with the entire first step", () => {
    storeBlocks();
    const countdown = startChain();
    tick(1000);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    fireEvent.click(screen.getByRole("button", { name: "Nächster Block" }));
    expect(countdown?.textContent).toBe("4");
    expect(frames.size).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Fortsetzen" }));
    tick(4000);
    expect(countdown?.textContent).toBe("1");
  });

  it("starts the whole routine again from block 1 after finishing", () => {
    storeBlocks();
    const countdown = startChain();
    tick(23000);
    expect(screen.getByText("Fertig ✓")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Start$/ }));
    expect(screen.getByText(/Block 1\/2.*Runde 1 von 3/)).toBeInTheDocument();
    expect(countdown?.textContent).toBe("2");
  });

  it("plays each incoming timer override at start, not the outgoing cue", () => {
    localStorage.setItem("kt.chain", JSON.stringify({
      name: "Cues", signal: "beep", cue: "tone", units: ["s"], prep: false,
      timers: [
        { id: "a", name: "Einatmen", ms: 1000, cue: "voice" },
        { id: "b", name: "Halten", ms: 1000, cue: "mute" },
        { id: "c", name: "Ausatmen", ms: 1000, cue: "both" },
      ],
    }));
    startChain();
    expect(speak).toHaveBeenCalledWith("Einatmen", 0.8);
    expect(playStep).not.toHaveBeenCalled();
    tick(1000);
    expect(speak).toHaveBeenCalledTimes(1);
    expect(playStep).not.toHaveBeenCalled();
    tick(2000);
    expect(speak).toHaveBeenLastCalledWith("Ausatmen", 0.8);
    expect(playStep).toHaveBeenCalledTimes(1);
    tick(3000);
    expect(playStep).toHaveBeenCalledTimes(1);
    expect(playFinale).toHaveBeenCalledTimes(1);
  });
});
