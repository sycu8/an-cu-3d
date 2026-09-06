import { describe, expect, it } from "vitest";
import { isRateLimited, resetRateLimits } from "../src/rate-limit";

describe("jobs POST rate limit", () => {
  it("allows up to 30 requests per minute per key", () => {
    resetRateLimits();
    const key = "test-ip";

    for (let i = 0; i < 30; i += 1) {
      expect(isRateLimited(key, 1_000)).toBe(false);
    }

    expect(isRateLimited(key, 1_000)).toBe(true);
  });
});
