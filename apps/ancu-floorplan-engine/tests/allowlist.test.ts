import { describe, expect, it } from "vitest";
import {
  DEFAULT_ALLOWLIST_DOMAINS,
  validateAllowlistedUrl,
} from "../src/allowlist";

describe("allowlist URL validation", () => {
  it("accepts official Gamuda HTTPS URLs", () => {
    const result = validateAllowlistedUrl(
      "https://www.gamudaland.com.vn/projects/example",
    );
    expect(result.ok).toBe(true);
  });

  it("rejects non-HTTPS URLs", () => {
    const result = validateAllowlistedUrl(
      "http://www.gamudaland.com.vn/projects/example",
    );
    expect(result).toEqual({ ok: false, reason: "https_only" });
  });

  it("rejects domains outside the allowlist", () => {
    const result = validateAllowlistedUrl("https://evil.example/floorplan.png");
    expect(result).toEqual({ ok: false, reason: "domain_not_allowlisted" });
  });

  it("rejects localhost and private hosts", () => {
    expect(validateAllowlistedUrl("https://localhost/secret")).toEqual({
      ok: false,
      reason: "private_or_blocked_host",
    });
    expect(validateAllowlistedUrl("https://127.0.0.1/secret")).toEqual({
      ok: false,
      reason: "private_or_blocked_host",
    });
  });

  it("allows configured placeholder domains", () => {
    for (const domain of DEFAULT_ALLOWLIST_DOMAINS) {
      const result = validateAllowlistedUrl(`https://${domain}/`);
      expect(result.ok).toBe(true);
    }
  });
});
