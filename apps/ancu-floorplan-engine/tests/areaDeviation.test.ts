import { describe, expect, it } from "vitest";
import {
  areaDeviation,
  areaWithinTolerance,
} from "../src/pipeline/areaDeviation";

describe("areaDeviation helper", () => {
  it("returns 0 for identical areas", () => {
    expect(areaDeviation(50, 50)).toBe(0);
  });

  it("computes relative deviation", () => {
    expect(areaDeviation(100, 90)).toBeCloseTo(0.1);
    expect(areaDeviation(100, 110)).toBeCloseTo(0.1);
  });

  it("returns infinity for invalid inputs", () => {
    expect(areaDeviation(0, 50)).toBe(Number.POSITIVE_INFINITY);
    expect(areaDeviation(50, 0)).toBe(Number.POSITIVE_INFINITY);
  });

  it("checks tolerance band", () => {
    expect(areaWithinTolerance(100, 96, 0.05)).toBe(true);
    expect(areaWithinTolerance(100, 90, 0.05)).toBe(false);
  });
});
