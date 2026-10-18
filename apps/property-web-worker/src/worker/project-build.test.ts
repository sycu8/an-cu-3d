import { beforeEach, describe, expect, it, vi } from "vitest";
import { runProjectBuild } from "./project-build";
import type { Env } from "./types";

const events: string[] = [];
const jobPatches: Array<Record<string, unknown>> = [];

vi.mock("./db/jobs", () => ({
  appendBuildEvent: vi.fn(async (_db: unknown, event: { message: string }) => {
    events.push(event.message);
  }),
  updateBuildJob: vi.fn(async (_db: unknown, _id: string, patch: Record<string, unknown>) => {
    jobPatches.push(patch);
  }),
}));

vi.mock("./db/projects", () => ({
  upsertSynthesizedProject: vi.fn(async () => "proj_test"),
  updateProjectCoverR2Key: vi.fn(async () => {}),
}));

vi.mock("./ai/pipeline", () => ({
  discoverSources: vi.fn(async () => ({
    sources: [{ label: "Nguồn", url: "https://example.test/p" }],
    queryHints: ["hint"],
  })),
  crawlSources: vi.fn(async () => [
    { label: "Nguồn", url: "https://example.test/p", snippet: "snippet" },
  ]),
  synthesizeProject: vi.fn(async () => ({
    project: {
      name: "Test",
      slug: "test",
      tagline: "t",
      description: "d",
      city: "HCM",
      district: "Q1",
      address: "a",
      handover: "Chờ xác minh",
      priceRange: "Chờ xác minh",
      totalUnits: "Chờ xác minh",
      amenities: [],
      apartmentTypes: [],
      nearbyPlaces: [],
      sources: [],
      researchNotes: "",
      showroom: {
        lightingDefault: "day",
        materialPaletteLabel: "Ivory",
        hotspots: [],
      },
    },
  })),
  runFactualQa: vi.fn(async () => ({ ok: true, source: "test", issues: [] })),
  assist2dTo3d: vi.fn(async () => ({
    assistJsonKey: "assist.json",
    materials: { floor: "#fff", wall: "#fff", cabinet: "#fff", accent: "#fff" },
    notes: "n",
  })),
}));

const env = {
  DB: {} as D1Database,
  ENGINE_BASE_URL: "https://engine.test/",
  ENGINE_API_SECRET: "test-secret-value",
} as unknown as Env;

function failedWith(status: number): boolean {
  return jobPatches.some(
    (patch) => patch.status === "failed" && String(patch.error).includes(`HTTP ${status}`),
  );
}

describe("project build engine calls", () => {
  beforeEach(() => {
    events.length = 0;
    jobPatches.length = 0;
    vi.unstubAllGlobals();
  });

  it("fails the job on engine crawl 401 and does not log enqueue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unauthorized", { status: 401 })),
    );

    await runProjectBuild(env, { id: "job-401", name: "Celadon", slug: "celadon" });

    expect(events.some((message) => message.includes("đã enqueue"))).toBe(false);
    expect(events.some((message) => message.includes("HTTP 401"))).toBe(true);
    expect(failedWith(401)).toBe(true);
    expect(jobPatches.some((patch) => patch.status === "completed")).toBe(false);
  });

  it("fails the job on engine crawl 500 and does not log enqueue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("unavailable", { status: 500 })),
    );

    await runProjectBuild(env, { id: "job-500", name: "Celadon", slug: "celadon" });

    expect(events.some((message) => message.includes("đã enqueue"))).toBe(false);
    expect(events.some((message) => message.includes("HTTP 500"))).toBe(true);
    expect(failedWith(500)).toBe(true);
  });

  it("logs enqueue only after the engine accepts the crawl", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const headers = new Headers(init?.headers);
      expect(headers.get("Authorization")).toBe("Bearer test-secret-value");
      expect(url.startsWith("https://engine.test/")).toBe(true);
      return new Response("{}", { status: 202 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await runProjectBuild(env, { id: "job-ok", name: "Celadon", slug: "celadon" });

    expect(events.some((message) => message === "Engine crawl đã enqueue")).toBe(true);
    expect(jobPatches.some((patch) => patch.status === "completed")).toBe(true);
    expect(jobPatches.some((patch) => patch.status === "failed")).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
