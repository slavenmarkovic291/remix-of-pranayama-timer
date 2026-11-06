import { StrictMode, type ComponentType } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/index";

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

  it("runs the second timer for 13 seconds, not 26", () => {
    const countdown = startChain();
    tick(1000);
    expect(countdown?.textContent).toBe("13");
    tick(13000);
    expect(countdown?.textContent).toBe("1");
    tick(14000);
    expect(screen.getByText("Timer 3 / 3")).toBeInTheDocument();
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
});