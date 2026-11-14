import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PracticeTimer } from "@/components/library/PracticeTimer";
import { getPractice } from "@/lib/library";
import { playStep, playFinale } from "@/lib/sound";

vi.mock("@/lib/sound", async (original) => {
  const source = await original<typeof import("@/lib/sound")>();
  return { ...source, audio: vi.fn(), playStep: vi.fn(), playFinale: vi.fn(), speak: vi.fn(), vibrate: vi.fn() };
});

it("edits, saves and restores direct phase controls after remount and allows changes again", () => {
  const p = getPractice("box-breathing"); if (!p) throw new Error("Missing practice");
  const view = render(<PracticeTimer practice={p}/>);
  fireEvent.change(screen.getByLabelText("Einatmen (Sekunden)"), { target: { value: "3" } });
  fireEvent.change(screen.getByLabelText("Halten voll (Sekunden)"), { target: { value: "0" } });
  fireEvent.change(screen.getByLabelText("Ausatmen (Sekunden)"), { target: { value: "6" } });
  fireEvent.change(screen.getByLabelText("Halten leer (Sekunden)"), { target: { value: "1" } });
  fireEvent.change(screen.getByLabelText("Eigene Rundenzahl"), { target: { value: "2" } });
  fireEvent.click(screen.getByRole("button", { name: "Zeiten speichern" }));
  view.unmount(); render(<PracticeTimer practice={p}/>);
  expect(screen.getByLabelText("Einatmen (Sekunden)")).toHaveValue(3);
  expect(screen.getByLabelText("Halten voll (Sekunden)")).toHaveValue(0);
  expect(screen.getByLabelText("Ausatmen (Sekunden)")).toHaveValue(6);
  expect(screen.getByLabelText("Halten leer (Sekunden)")).toHaveValue(1);
  expect(screen.getByLabelText("Eigene Rundenzahl")).toHaveValue(2);
  fireEvent.click(screen.getByRole("button", { name: "Praxis starten · 0:20" }));
  expect(screen.getByRole("progressbar", { name: "Sitzungsfortschritt" })).toHaveAttribute("max", "20000");
  fireEvent.click(screen.getByRole("button", { name: "Praxis schließen" }));
  fireEvent.change(screen.getByLabelText("Einatmen (Sekunden)"), { target: { value: "5" } });
  fireEvent.click(screen.getByRole("button", { name: "Zeiten speichern" }));
  expect(JSON.parse(localStorage.getItem(`prana.practice-times.v1.${p.id}`) ?? "{}").inhale).toBe(5);
});

it("starts a saved ten-minute Nadi Shuddhi session with no paced breaths", () => {
  const p = getPractice("nadi-shuddhi"); if (!p) throw new Error("Missing practice");
  const view = render(<PracticeTimer practice={p}/>);
  expect(screen.queryByLabelText("Einatmen (Sekunden)")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Eigene Dauer in Minuten"), { target: { value: "10" } });
  fireEvent.click(screen.getByRole("button", { name: "Zeiten speichern" }));
  view.unmount(); render(<PracticeTimer practice={p}/>);
  expect(screen.getByLabelText("Eigene Dauer in Minuten")).toHaveValue(10);
  fireEvent.click(screen.getByRole("button", { name: "Praxis starten · 10:00" }));
  expect(screen.getByRole("progressbar", { name: "Sitzungsfortschritt" })).toHaveAttribute("max", "600000");
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