// DB-level checks run on Node against in-memory SQLite (D1's SQL engine).
// @ts-expect-error node builtin is available under vitest
import { readFileSync, readdirSync } from "node:fs";
// @ts-expect-error node builtin is available under vitest
import { join } from "node:path";
// @ts-expect-error node builtin is available under vitest
import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import worker from "./index";
import { createBuildJob } from "./db/jobs";
import { getDbProjectBySlug, listDbProjectSummaries } from "./db/projects";
import { runProjectBuild } from "./project-build";
import type { Env } from "./types";

vi.mock("./ai/pipeline", () => ({
  discoverSources: vi.fn(async () => ({
    sources: [{ label: "CDT", url: "https://example.test/eaton" }],
    queryHints: ["eaton"],
  })),
  crawlSources: vi.fn(async () => [
    { label: "CDT", url: "https://example.test/eaton", snippet: "live snippet" },
  ]),
  synthesizeProject: vi.fn(async () => ({
    project: {
      name: "OVERWRITTEN",
      slug: "eaton-park",
      tagline: "Chờ xác minh",
      description: "should not replace the live row",
      city: "Chờ xác minh",
      district: "Chờ xác minh",
      address: "Chờ xác minh",
      handover: "Chờ xác minh",
      priceRange: "Chờ xác minh",
      totalUnits: "Chờ xác minh",
      amenities: [],
      apartmentTypes: [],
      nearbyPlaces: [],
      sources: [],
      researchNotes: "failed rebuild",
      showroom: {
        lightingDefault: "day",
        materialPaletteLabel: "Chờ xác minh",
        hotspots: [],
      },
    },
  })),
  runFactualQa: vi.fn(async () => ({ ok: true, source: "test", issues: [] })),
  assist2dTo3d: vi.fn(async () => ({
    assistJsonKey: "assist.json",
    materials: { floor: "#fff", wall: "#fff", cabinet: "#fff", accent: "#fff" },
  })),
}));

type SqliteStatement = {
  get(...args: unknown[]): unknown;
  all(...args: unknown[]): unknown[];
  run(...args: unknown[]): { changes: number };
};

type SqliteDatabase = {
  exec(sql: string): void;
  prepare(sql: string): SqliteStatement;
};

function migrationsDir(): string {
  const candidates = [
    join(process.cwd(), "migrations"),
    join(process.cwd(), "apps/property-web-worker/migrations"),
  ];
  for (const dir of candidates) {
    try {
      readdirSync(dir);
      return dir;
    } catch {
      /* try the next candidate */
    }
  }
  throw new Error("property-web migrations directory not found");
}

function openMemoryDb(): D1Database {
  const database = new (DatabaseSync as new (path: string) => SqliteDatabase)(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  const migrations = migrationsDir();
  for (const file of readdirSync(migrations).filter((name: string) => name.endsWith(".sql")).sort()) {
    database.exec(readFileSync(join(migrations, file), "utf8"));
  }

  function prepare(sql: string) {
    const stmt = database.prepare(sql);
    let binds: unknown[] = [];
    const api = {
      bind(...args: unknown[]) {
        binds = args;
        return api;
      },
      async first<T>() {
        const row = stmt.get(...binds) as T | undefined;
        return row ?? null;
      },
      async all<T>() {
        return { results: stmt.all(...binds) as T[] };
      },
      async run() {
        const info = stmt.run(...binds);
        return { success: true, meta: { changes: info.changes } };
      },
    };
    return api;
  }

  return { prepare } as unknown as D1Database;
}

function buildEnv(db: D1Database): Env {
  return {
    DB: db,
    ENGINE_BASE_URL: "https://engine.test",
    ENGINE_API_SECRET: "test-secret-value",
  } as unknown as Env;
}

async function seedLiveEaton(db: D1Database): Promise<void> {
  await db
    .prepare(
      `INSERT INTO developers (id, slug, name, source_class)
       VALUES ('dev_gamuda_land', 'gamuda-land', 'Gamuda Land', 'verified_public')`,
    )
    .run();
  await db
    .prepare(
      `INSERT INTO projects (
         id, developer_id, slug, name, tagline, description, city, district, address,
         handover, price_range, total_units, status, source_class, provenance, confidence, updated_at
       ) VALUES (
         'proj_eaton-park', 'dev_gamuda_land', 'eaton-park', 'Eaton Park Live',
         'Live tagline', 'Live description', 'TP. Hồ Chí Minh', 'TP. Thủ Đức', '12 Mai Chi Tho',
         '2026', '80 trieu', '1200', 'published', 'verified_public', 'qa fixture', 0.9,
         '2020-01-01 00:00:00'
       )`,
    )
    .run();
  await db
    .prepare(
      `INSERT INTO amenities (id, project_id, category, name, source_class)
       VALUES ('am_pool', 'proj_eaton-park', 'pool', 'Hồ bơi Eaton thật', 'verified_public')`,
    )
    .run();
  await db
    .prepare(
      `INSERT INTO apartment_types (
         id, project_id, slug, name, bedrooms, bathrooms, area_sqm, price, source_class
       ) VALUES (
         'apt_2br', 'proj_eaton-park', '2br-c', '2PN', 2, 2, '75', '80 trieu', 'verified_public'
       )`,
    )
    .run();
  await db
    .prepare(
      `INSERT INTO nearby_places (
         id, project_id, category, name, distance_km, travel_time, source_class
       ) VALUES (
         'near_metro', 'proj_eaton-park', 'transit', 'Ga metro Thao Dien', '1.2', '5 phut', 'verified_public'
       )`,
    )
    .run();
  await db
    .prepare(
      `INSERT INTO project_sources (
         id, project_id, source_type, source_url, source_label, source_class
       ) VALUES (
         'src_cdt', 'proj_eaton-park', 'web', 'https://example.test/eaton', 'CDT', 'verified_public'
       )`,
    )
    .run();
}

type Row = Record<string, unknown>;

async function eatonSnapshot(db: D1Database): Promise<{
  project: Row | null;
  amenities: Row[];
  apartmentTypes: Row[];
  nearbyPlaces: Row[];
  sources: Row[];
}> {
  const project = await db
    .prepare(
      `SELECT id, slug, name, tagline, description, city, district, address, handover,
              price_range, total_units, status, updated_at
       FROM projects WHERE slug = 'eaton-park'`,
    )
    .first<Row>();
  const amenities = await db
    .prepare(`SELECT id, project_id, category, name FROM amenities WHERE project_id = 'proj_eaton-park' ORDER BY id`)
    .all<Row>();
  const apartmentTypes = await db
    .prepare(
      `SELECT id, project_id, slug, name, bedrooms, area_sqm
       FROM apartment_types WHERE project_id = 'proj_eaton-park' ORDER BY id`,
    )
    .all<Row>();
  const nearbyPlaces = await db
    .prepare(
      `SELECT id, project_id, category, name, distance_km
       FROM nearby_places WHERE project_id = 'proj_eaton-park' ORDER BY id`,
    )
    .all<Row>();
  const sources = await db
    .prepare(
      `SELECT id, project_id, source_url, source_label
       FROM project_sources WHERE project_id = 'proj_eaton-park' ORDER BY id`,
    )
    .all<Row>();
  return {
    project,
    amenities: amenities.results ?? [],
    apartmentTypes: apartmentTypes.results ?? [],
    nearbyPlaces: nearbyPlaces.results ?? [],
    sources: sources.results ?? [],
  };
}

async function jobRow(db: D1Database, id: string): Promise<Row | null> {
  return db.prepare(`SELECT status, stage, error, result_json FROM project_build_jobs WHERE id = ?`).bind(id).first<Row>();
}

describe("project build against in-memory D1", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps every row when a rebuild of an existing project fails", async () => {
    const { crawlSources } = await import("./ai/pipeline");
    vi.mocked(crawlSources).mockRejectedValueOnce(new Error("crawl down"));
    const db = openMemoryDb();
    await seedLiveEaton(db);
    const before = await eatonSnapshot(db);
    await createBuildJob(db, { id: "job-eaton-crawl", name: "Eaton Park Rebuild", slug: "eaton-park" });

    await runProjectBuild(buildEnv(db), {
      id: "job-eaton-crawl",
      name: "Eaton Park Rebuild",
      slug: "eaton-park",
    });

    expect(await eatonSnapshot(db)).toEqual(before);
    const job = await jobRow(db, "job-eaton-crawl");
    expect(job?.status).toBe("failed");
    expect(job?.error).toBe("crawl down");
    expect(String(job?.result_json)).toContain('"preserved":true');
    expect(String(job?.result_json)).toContain('"persisted":false');

    const listed = await listDbProjectSummaries(db);
    expect(listed.map((project) => project.slug)).toEqual(["eaton-park"]);
    const detail = await getDbProjectBySlug(db, "eaton-park");
    expect(detail?.name).toBe("Eaton Park Live");
    expect(detail?.amenities.map((amenity) => amenity.name)).toEqual(["Hồ bơi Eaton thật"]);
  });

  it("keeps every row when engine /jobs fails during a rebuild", async () => {
    const db = openMemoryDb();
    await seedLiveEaton(db);
    const before = await eatonSnapshot(db);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/jobs")) return new Response("nope", { status: 502 });
        return new Response("{}", { status: 202 });
      }),
    );
    await createBuildJob(db, { id: "job-eaton-jobs", name: "Eaton Park Rebuild", slug: "eaton-park" });

    await runProjectBuild(buildEnv(db), {
      id: "job-eaton-jobs",
      name: "Eaton Park Rebuild",
      slug: "eaton-park",
    });

    expect(await eatonSnapshot(db)).toEqual(before);
    const job = await jobRow(db, "job-eaton-jobs");
    expect(job?.status).toBe("failed");
    expect(String(job?.error)).toContain("HTTP 502");
    expect(String(job?.result_json)).toContain('"preserved":true');
    const names = await db.prepare(`SELECT name FROM projects`).all<{ name: string }>();
    expect(names.results?.map((row) => row.name)).toEqual(["Eaton Park Live"]);
  });

  it("never publishes a failed new project, and drops it if a status filter is removed", async () => {
    const { crawlSources } = await import("./ai/pipeline");
    vi.mocked(crawlSources).mockRejectedValueOnce(new Error("crawl down"));
    const db = openMemoryDb();
    await db
      .prepare(
        `INSERT INTO developers (id, slug, name) VALUES ('dev_gamuda_land', 'gamuda-land', 'Gamuda Land')`,
      )
      .run();
    await db
      .prepare(
        `INSERT INTO projects (
           id, developer_id, slug, name, status, source_class, updated_at
         ) VALUES ('proj_qa_published', 'dev_gamuda_land', 'qa-published', 'QA Published', 'published', 'estimated', '2020-01-02 00:00:00')`,
      )
      .run();
    await db
      .prepare(
        `INSERT INTO amenities (id, project_id, category, name) VALUES ('am_qa', 'proj_qa_published', 'park', 'Công viên QA')`,
      )
      .run();
    await db
      .prepare(
        `INSERT INTO projects (
           id, developer_id, slug, name, tagline, status, source_class
         ) VALUES (
           'proj_qa_draft', 'dev_gamuda_land', 'qa-draft', 'QA Draft', 'not public', 'draft', 'estimated'
         )`,
      )
      .run();
    await createBuildJob(db, { id: "job-new", name: "Brand New", slug: "qa-failed-new" });

    await runProjectBuild(buildEnv(db), {
      id: "job-new",
      name: "Brand New",
      slug: "qa-failed-new",
    });

    const failed = await db
      .prepare(`SELECT name, tagline, status FROM projects WHERE slug = 'qa-failed-new'`)
      .first<{ name: string; tagline: string; status: string }>();
    expect(failed).toMatchObject({
      name: "Brand New",
      tagline: "Chờ xác minh",
      status: "failed",
    });

    const listed = (await listDbProjectSummaries(db)).map((project) => project.slug);
    expect(listed).toEqual(["qa-published"]);
    expect(await getDbProjectBySlug(db, "qa-published")).toMatchObject({
      name: "QA Published",
      amenities: [{ name: "Công viên QA" }],
    });
    expect(await getDbProjectBySlug(db, "qa-failed-new")).toBeNull();
    expect(await getDbProjectBySlug(db, "qa-draft")).toBeNull();

    const env = buildEnv(db);
    const listResponse = await worker.fetch(new Request("https://ancu.test/api/projects"), env);
    expect(listResponse.status).toBe(200);
    const listBody = (await listResponse.json()) as { projects: { slug: string }[] };
    const publicSlugs = listBody.projects.map((project) => project.slug);
    expect(publicSlugs).toContain("qa-published");
    expect(publicSlugs).not.toContain("qa-failed-new");
    expect(publicSlugs).not.toContain("qa-draft");

    const published = await worker.fetch(new Request("https://ancu.test/api/projects/qa-published"), env);
    expect(published.status).toBe(200);
    const hiddenFailed = await worker.fetch(
      new Request("https://ancu.test/api/projects/qa-failed-new"),
      env,
    );
    expect(hiddenFailed.status).toBe(404);
    const hiddenDraft = await worker.fetch(new Request("https://ancu.test/api/projects/qa-draft"), env);
    expect(hiddenDraft.status).toBe(404);
  });
});
