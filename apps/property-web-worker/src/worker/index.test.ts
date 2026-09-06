import { describe, expect, it } from "vitest";
import worker from "./index";
import type { Env } from "./types";

const env = {} as Env;

describe("worker security + health", () => {
  it("returns health ok with security headers", async () => {
    const response = await worker.fetch(new Request("http://localhost/api/health"), env);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: "ok" });
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("Permissions-Policy")).toContain("camera=()");
    expect(response.headers.get("X-Request-Id")).toBeTruthy();
    expect(response.headers.get("Content-Security-Policy")).toContain("tile.openstreetmap.org");
  });

  it("includes APP_VERSION in health when set", async () => {
    const versionedEnv = { ...env, APP_VERSION: "1.2.3" } as Env;
    const response = await worker.fetch(new Request("http://localhost/api/health"), versionedEnv);
    const body = await response.json();

    expect(body).toMatchObject({ status: "ok", version: "1.2.3" });
  });

  it("returns 405 JSON for non-GET API requests", async () => {
    const response = await worker.fetch(
      new Request("http://localhost/api/projects", { method: "POST" }),
      env,
    );
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(body).toEqual({ error: "Method Not Allowed" });
    expect(response.headers.get("X-Request-Id")).toBeTruthy();
  });
});
