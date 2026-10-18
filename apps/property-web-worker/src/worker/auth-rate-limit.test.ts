import { describe, expect, it } from "vitest";
import { allowAuthAttempt, clientAddress } from "./auth-rate-limit";

describe("admin auth rate limit", () => {
  it("allows a burst and then blocks that IP and scope", () => {
    const ip = "203.0.113.10";
    const now = 1_700_000_000_000;
    expect(allowAuthAttempt(ip, "login", now, 2, 1_000)).toBe(true);
    expect(allowAuthAttempt(ip, "login", now + 1, 2, 1_000)).toBe(true);
    expect(allowAuthAttempt(ip, "login", now + 2, 2, 1_000)).toBe(false);
    expect(allowAuthAttempt(ip, "bootstrap", now + 2, 2, 1_000)).toBe(true);
    expect(allowAuthAttempt(ip, "login", now + 1_000, 2, 1_000)).toBe(true);
  });

  it("reads the Cloudflare client IP", () => {
    const request = new Request("http://localhost/api/admin/login", {
      headers: { "CF-Connecting-IP": " 198.51.100.4 " },
    });
    expect(clientAddress(request)).toBe("198.51.100.4");
    expect(clientAddress(new Request("http://localhost/api/admin/login"))).toBe("unknown");
  });
});
