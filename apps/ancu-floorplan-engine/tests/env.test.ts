import { describe, expect, it } from "vitest";
import { assertProductionEnv } from "../src/env";

describe("assertProductionEnv", () => {
  it("skips validation outside production", () => {
    expect(() =>
      assertProductionEnv({ ENVIRONMENT: "development" }),
    ).not.toThrow();
    expect(() => assertProductionEnv({})).not.toThrow();
  });

  it("requires ENGINE_API_SECRET length >= 16 in production", () => {
    expect(() =>
      assertProductionEnv({
        ENVIRONMENT: "production",
        ENGINE_API_SECRET: "short",
      }),
    ).toThrow(/ENGINE_API_SECRET/);

    expect(() =>
      assertProductionEnv({
        ENVIRONMENT: "production",
        ENGINE_API_SECRET: "sixteen-char-secret",
      }),
    ).not.toThrow();
  });
});
