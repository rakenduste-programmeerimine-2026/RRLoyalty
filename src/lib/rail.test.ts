import { describe, expect, it } from "vitest";
import { STOPS, nextStop, pointsToNext, railPosition, stopState } from "./rail";

const stopAt = (at: number) => STOPS.find((stop) => stop.at === at)!;

describe("nextStop", () => {
  it("is the first stop above the points", () => {
    expect(nextStop(52)?.at).toBe(100);
  });

  it("moves on when a stop is reached exactly", () => {
    expect(nextStop(100)?.at).toBe(150);
  });

  it("is undefined at the end of the rail", () => {
    expect(nextStop(400)).toBeUndefined();
  });
});

describe("stopState", () => {
  it("opens stops at or below the points", () => {
    expect(stopState(stopAt(50), 50)).toBe("open");
  });

  it("marks only the nearest unreached stop as next", () => {
    expect(stopState(stopAt(100), 52)).toBe("next");
    expect(stopState(stopAt(150), 52)).toBe("locked");
  });
});

describe("STOPS", () => {
  it("matches the stop types in docs/program-rules.md", () => {
    expect(STOPS.map((stop) => [stop.at, stop.type])).toEqual([
      [50, "direct"],
      [100, "prize_choice"],
      [150, "code_once"],
      [200, "prize_choice"],
      [250, "direct"],
      [300, "prize_choice"],
      [350, "direct"],
      [400, "prize_choice"],
    ]);
  });
});

describe("pointsToNext", () => {
  it("counts the points left to the next stop", () => {
    expect(pointsToNext(52)).toBe(48);
  });

  it("is zero at the end of the rail", () => {
    expect(pointsToNext(450)).toBe(0);
  });
});

describe("railPosition", () => {
  it("maps points onto the rail", () => {
    expect(railPosition(100)).toBe(25);
  });

  it("stays on the rail for out-of-range points", () => {
    expect(railPosition(-5)).toBe(0);
    expect(railPosition(500)).toBe(100);
  });
});
