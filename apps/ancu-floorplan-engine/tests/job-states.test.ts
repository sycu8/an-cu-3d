import { describe, expect, it } from "vitest";
import {
  canTransition,
  nextPipelineStatus,
} from "../src/pipeline/states";

describe("conversion job state machine", () => {
  it("walks the pipeline in order", () => {
    let current: "DISCOVERED" | "DOWNLOADED" | "NORMALIZED" | "ANALYZING" | "RECONSTRUCTING" | "VALIDATING" =
      "DISCOVERED";
    const expected = [
      "DOWNLOADED",
      "NORMALIZED",
      "ANALYZING",
      "RECONSTRUCTING",
      "VALIDATING",
    ] as const;

    for (const next of expected) {
      expect(canTransition(current, next)).toBe(true);
      current = next;
    }
  });

  it("allows validation outcomes", () => {
    expect(canTransition("VALIDATING", "NEEDS_REVIEW")).toBe(true);
    expect(canTransition("VALIDATING", "APPROVED")).toBe(true);
    expect(canTransition("VALIDATING", "FAILED")).toBe(true);
  });

  it("allows review decisions and publish", () => {
    expect(canTransition("NEEDS_REVIEW", "APPROVED")).toBe(true);
    expect(canTransition("NEEDS_REVIEW", "FAILED")).toBe(true);
    expect(canTransition("APPROVED", "PUBLISHED")).toBe(true);
  });

  it("blocks invalid skips", () => {
    expect(canTransition("DISCOVERED", "VALIDATING")).toBe(false);
    expect(canTransition("FAILED", "APPROVED")).toBe(false);
    expect(canTransition("PUBLISHED", "DISCOVERED")).toBe(false);
  });

  it("returns the next pipeline status", () => {
    expect(nextPipelineStatus("DISCOVERED")).toBe("DOWNLOADED");
    expect(nextPipelineStatus("VALIDATING")).toBeNull();
  });
});
