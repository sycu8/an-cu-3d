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
    expect(response.headers.get("Content-Security-Policy")).toContain("worker-src 'self' blob:");
    expect(response.headers.get("Content-Security-Policy")).toContain("wasm-unsafe-eval");
    expect(response.headers.get("Content-Security-Policy")).toContain("celadoncityhcm.com");
    expect(response.headers.get("Content-Security-Policy")).toContain("ecopark.com.vn");
    expect(response.headers.get("Content-Security-Policy")).toContain("gamudaland.com.vn");
    expect(response.headers.get("Content-Security-Policy")).toContain("storage.googleapis.com");
    expect(response.headers.get("Content-Security-Policy")).toContain("cdn.onehousing.vn");
    expect(response.headers.get("Content-Security-Policy")).toContain("upload.wikimedia.org");
    expect(response.headers.get("Content-Security-Policy")).toContain("web.archive.org");
    expect(response.headers.get("Content-Security-Policy")).toContain("theprive.vn");
    expect(response.headers.get("Content-Security-Policy")).not.toContain("unsplash");
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

  it("lists seed projects from GET /api/projects without D1", async () => {
    const response = await worker.fetch(new Request("http://localhost/api/projects"), env);
    const body = (await response.json()) as {
      projects: { slug: string; developerName?: string }[];
      source?: string;
    };
    expect(response.status).toBe(200);
    expect(body.projects.length).toBeGreaterThanOrEqual(8);
    expect(body.projects.some((p) => p.slug === "celadon-city")).toBe(true);
    expect(body.projects.some((p) => p.slug === "vinhomes-grand-park")).toBe(true);
    expect(body.projects.some((p) => p.slug === "ecopark")).toBe(true);
    expect(body.projects.some((p) => p.slug === "opal-boulevard")).toBe(true);
    expect(body.projects.some((p) => p.slug.startsWith("demo-"))).toBe(false);
  });

  it("resolves seed project detail by slug", async () => {
    const response = await worker.fetch(
      new Request("http://localhost/api/projects/vinhomes-grand-park"),
      env,
    );
    const body = (await response.json()) as {
      project: {
        slug: string;
        name: string;
        priceRange?: string;
        confidence?: number;
        provenance?: string;
        handoverUnits?: unknown[];
      };
    };
    expect(response.status).toBe(200);
    expect(body.project.slug).toBe("vinhomes-grand-park");
    expect(body.project.name).toContain("Vinhomes");
    expect((body.project.handoverUnits ?? []).length).toBeGreaterThan(0);
    // Buyer API: secondary-market research and confidence are not exposed
    expect(body.project.priceRange ?? "").not.toMatch(/thứ cấp/i);
    expect(body.project.confidence).toBeUndefined();
    expect(body.project.provenance).toMatch(/xác minh|tham khảo|dữ liệu/i);
  });

  it("rejects admin routes without a session bearer", async () => {
    const response = await worker.fetch(
      new Request("http://localhost/api/admin/projects"),
      env,
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthorized" });
  });

});
