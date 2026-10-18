import { describe, expect, it, vi } from "vitest";
import {
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

  it("rejects stored PBKDF2 iteration counts above the Workers maximum", async () => {
    const salt = btoa("salt-value-16b!");
    const hash = btoa("hash-value-32bytes-pad-pad");
    const over = `pbkdf2-sha256$100001$${salt}$${hash}`;
    const atCap = `pbkdf2-sha256$100000$${salt}$${hash}`;
    const farOver = `pbkdf2-sha256$9000000$${salt}$${hash}`;
    expect(parsePasswordHash(over)).toBeNull();
    expect(parsePasswordHash(farOver)).toBeNull();
    expect(parsePasswordHash(atCap)?.iterations).toBe(100_000);
    const spy = vi.spyOn(crypto.subtle, "deriveBits");
    try {
      expect(await verifyPassword("whatever-password", over)).toBe(false);
      expect(await verifyPassword("whatever-password", farOver)).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it("rejects weak replacement passwords", () => {
    expect(validateNewPassword("short", "operator")).toBe("password_too_short");
    expect(validateNewPassword("operator", "operator")).toBe("password_matches_username");
    expect(validateNewPassword("secure-enough", "operator")).toBeNull();
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
