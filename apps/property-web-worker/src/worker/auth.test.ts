import { describe, expect, it } from "vitest";
import {
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
  createSessionToken,
  extractBearerToken,
  hashPassword,
  hashSessionToken,
  parsePasswordHash,
  sessionExpiresAt,
  validateNewPassword,
  verifyPassword,
} from "./auth";

describe("admin password + session crypto", () => {
  it("hashes and verifies passwords with PBKDF2", async () => {
    const serialized = await hashPassword("correct-horse");
    const parsed = parsePasswordHash(serialized);
    expect(parsed?.algorithm).toBe("pbkdf2-sha256");
    expect(parsed?.iterations).toBeGreaterThanOrEqual(100_000);
    expect(await verifyPassword("correct-horse", serialized)).toBe(true);
    expect(await verifyPassword("wrong-password", serialized)).toBe(false);
  });

  it("rejects weak / default replacement passwords", () => {
    expect(validateNewPassword("short", DEFAULT_ADMIN_USERNAME)).toBe("password_too_short");
    expect(validateNewPassword(DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_USERNAME)).toBe(
      "password_is_default",
    );
    expect(validateNewPassword(DEFAULT_ADMIN_USERNAME, DEFAULT_ADMIN_USERNAME)).toBe(
      "password_matches_username",
    );
    expect(validateNewPassword("secure-enough", DEFAULT_ADMIN_USERNAME)).toBeNull();
  });

  it("creates opaque session tokens and hashes them", async () => {
    const token = createSessionToken();
    expect(token.length).toBeGreaterThan(20);
    const hash = await hashSessionToken(token);
    expect(hash).not.toBe(token);
    expect(await hashSessionToken(token)).toBe(hash);
  });

  it("formats session expiry for SQLite datetime comparison", () => {
    const expires = sessionExpiresAt(Date.UTC(2026, 0, 1, 0, 0, 0));
    expect(expires).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it("extracts bearer tokens", () => {
    expect(extractBearerToken("Bearer abc.def")).toBe("abc.def");
    expect(extractBearerToken("Basic abc")).toBeNull();
    expect(extractBearerToken(null)).toBeNull();
  });
});
