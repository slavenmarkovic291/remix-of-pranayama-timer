import { describe, it, expect } from "vitest";
import { formatMs, joinMs, splitMs } from "./timer";

describe("timer units", () => {
  it("only seconds: 90s stays 90 seconds", () => {
    expect(splitMs(90000, ["s"])).toEqual({ s: 90 });
    expect(formatMs(90000, ["s"])).toBe("90");
  });
  it("minutes+seconds split", () => {
    expect(formatMs(90000, ["m", "s"])).toBe("1:30");
    expect(joinMs({ m: 1, s: 30 })).toBe(90000);
  });
  it("milliseconds shown", () => {
    expect(formatMs(1250, ["s", "ms"])).toBe("1.250");
  });
});
