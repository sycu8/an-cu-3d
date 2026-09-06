import { describe, expect, it } from "vitest";
import { app, type Env } from "../src/app";

function mockEnv(overrides: Partial<Env> = {}): Env {
  return {
    ENGINE_DB: {} as D1Database,
    FLOORPLANS: {} as R2Bucket,
    CONVERSION_QUEUE: {} as Queue<unknown>,
    CRAWL_QUEUE: {} as Queue<unknown>,
    CONVERSION_WORKFLOW: {} as Workflow,
    AI: {} as Ai,
    BROWSER: {} as Fetcher,
    ENGINE_API_SECRET: "dev-secret-at-least-16",
    PUBLISH_CONFIDENCE_HIGH: "0.90",
    PUBLISH_CONFIDENCE_REVIEW: "0.75",
    ...overrides,
  };
}

describe("GET /health", () => {
  it("returns expected shape with binding presence booleans", async () => {
    const res = await app.request("/health", {}, mockEnv());

    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      ok: boolean;
      service: string;
      ts: string;
      requestId: string;
      bindings: Record<string, boolean>;
    };

    expect(body).toMatchObject({
      ok: true,
      service: "ancu-floorplan-engine",
      bindings: {
        db: true,
        r2: true,
        conversionQueue: true,
        crawlQueue: true,
        workflow: true,
        ai: true,
      },
    });
    expect(body.ts).toBeTruthy();
    expect(body.requestId).toBeTruthy();
    expect(res.headers.get("X-Request-Id")).toBe(body.requestId);
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("reports missing bindings as false without leaking secrets", async () => {
    const res = await app.request(
      "/health",
      {},
      mockEnv({
        ENGINE_DB: undefined as unknown as D1Database,
        AI: undefined as unknown as Ai,
      }),
    );

    const body = (await res.json()) as { bindings: Record<string, boolean> };
    expect(body.bindings.db).toBe(false);
    expect(body.bindings.ai).toBe(false);
    expect(body.bindings.r2).toBe(true);
    expect(JSON.stringify(body)).not.toMatch(/secret|password|token/i);
  });
});
