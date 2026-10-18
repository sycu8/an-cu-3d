// DB-level checks run on Node against in-memory SQLite (D1's SQL engine).
// @ts-expect-error node builtin is available under vitest
import { readFileSync, readdirSync } from "node:fs";
// @ts-expect-error node builtin is available under vitest
import { join } from "node:path";
// @ts-expect-error node builtin is available under vitest
import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import worker from "./index";
import { createAdminSession } from "./db/admin";
import { createBuildJob } from "./db/jobs";
import {
  getAdminDbProjectBySlug,
  getDbProjectBySlug,
  listAdminDbProjects,
  listDbProjectSummaries,
  upsertSynthesizedProject,
} from "./db/projects";
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
  generateBlogDraft: vi.fn(async () => ({
    title: "Draft",
    excerpt: "e",
    bodyMarkdown: "b",
    seoTitle: "s",
    seoDescription: "d",
    coverPrompt: "c",
  })),
  generateImageAsset: vi.fn(async () => ({ r2Key: "blog/cover", note: "test" })),
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
        return { success: true, meta: { changes: Number(info.changes) } };
      },
    };
    return api;
  }

  return {
    prepare,
    async batch(statements: { run: () => Promise<{ success: boolean; meta: { changes: number } }> }[]) {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    },
  } as unknown as D1Database;
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

const PENDING = "Chờ xác minh";

async function seedDeveloper(db: D1Database): Promise<void> {
  await db
    .prepare(
      `INSERT INTO developers (id, slug, name) VALUES ('dev_gamuda_land', 'gamuda-land', 'Gamuda Land')`,
    )
    .run();
}

async function adminToken(db: D1Database): Promise<string> {
  await db
    .prepare(
      `INSERT INTO admin_users (id, username, password_hash, must_change_password)
       VALUES ('admin_qa', 'qa-admin', 'unused', 0)`,
    )
    .run();
  const { token } = await createAdminSession(db, "admin_qa");
  return token;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

describe("admin project reads and approve-all", () => {
  it("lists and loads every status for admin while public reads stay published-only", async () => {
    const db = openMemoryDb();
    await seedDeveloper(db);
    await db
      .prepare(
        `INSERT INTO projects (id, developer_id, slug, name, tagline, status, source_class)
         VALUES
           ('proj_pub', 'dev_gamuda_land', 'qa-published', 'QA Published', 'Live', 'published', 'estimated'),
           ('proj_fail', 'dev_gamuda_land', 'qa-failed', 'Failed Build', 'Live fail', 'failed', 'estimated'),
           ('proj_draft', 'dev_gamuda_land', 'qa-draft', 'Draft Build', 'Not yet', 'draft', 'estimated')`,
      )
      .run();
    await db
      .prepare(
        `INSERT INTO projects (id, developer_id, slug, name, tagline, status, source_class)
         VALUES ('proj_active', 'dev_gamuda_land', 'qa-active', 'Active Listing', 'Ready', 'published', 'estimated')`,
      )
      .run();
    await db.prepare(`UPDATE projects SET status = 'active' WHERE slug = 'qa-active'`).run();
    await db
      .prepare(
        `INSERT INTO projects (id, developer_id, slug, name)
         VALUES ('proj_omit', 'dev_gamuda_land', 'qa-omit-status', 'Omitted Status')`,
      )
      .run();

    const admin = await listAdminDbProjects(db);
    const bySlug = new Map(admin.map((project) => [project.slug, project.status]));
    expect(bySlug.get("qa-published")).toBe("published");
    expect(bySlug.get("qa-failed")).toBe("failed");
    expect(bySlug.get("qa-draft")).toBe("draft");
    expect(bySlug.get("qa-active")).toBe("active");
    expect(bySlug.get("qa-omit-status")).toBe("draft");
    expect((await listDbProjectSummaries(db)).map((project) => project.slug)).toEqual(["qa-published"]);

    expect(await getAdminDbProjectBySlug(db, "qa-failed")).toMatchObject({
      name: "Failed Build",
      status: "failed",
    });
    expect(await getAdminDbProjectBySlug(db, "qa-draft")).toMatchObject({ status: "draft" });
    expect(await getAdminDbProjectBySlug(db, "qa-active")).toMatchObject({ status: "active" });
    expect(await getDbProjectBySlug(db, "qa-failed")).toBeNull();
    expect(await getDbProjectBySlug(db, "qa-draft")).toBeNull();
    expect(await getDbProjectBySlug(db, "qa-active")).toBeNull();
    expect(await getDbProjectBySlug(db, "qa-omit-status")).toBeNull();

    const env = buildEnv(db);
    const token = await adminToken(db);
    const listed = await worker.fetch(
      new Request("https://ancu.test/api/admin/projects", { headers: authHeaders(token) }),
      env,
    );
    expect(listed.status).toBe(200);
    const body = (await listed.json()) as { projects: { slug: string; status?: string }[] };
    const failed = body.projects.find((project) => project.slug === "qa-failed");
    expect(failed?.status).toBe("failed");
    expect(body.projects.some((project) => project.slug === "qa-draft" && project.status === "draft")).toBe(
      true,
    );
    expect(body.projects.some((project) => project.slug === "qa-active" && project.status === "active")).toBe(
      true,
    );

    const { generateBlogDraft } = await import("./ai/pipeline");
    const generated = await worker.fetch(
      new Request("https://ancu.test/api/admin/blog/generate", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ projectSlugs: ["qa-failed"] }),
      }),
      env,
    );
    expect(generated.status).toBe(201);
    expect(generateBlogDraft).toHaveBeenCalledWith(
      expect.anything(),
      [expect.objectContaining({ slug: "qa-failed", name: "Failed Build" })],
    );
  });

  it("does not publish a failed placeholder or overwrite a published row", async () => {
    const db = openMemoryDb();
    await seedDeveloper(db);
    await db
      .prepare(
        `INSERT INTO projects (
           id, developer_id, slug, name, tagline, description, city, status, source_class
         ) VALUES (
           'proj_pub', 'dev_gamuda_land', 'qa-published', 'Stay Published', 'Keep me',
           'Live description', 'HCM', 'published', 'verified_public'
         )`,
      )
      .run();
    await db
      .prepare(
        `INSERT INTO amenities (id, project_id, category, name) VALUES ('am_keep', 'proj_pub', 'park', 'Công viên thật')`,
      )
      .run();
    await db
      .prepare(
        `INSERT INTO projects (
           id, developer_id, slug, name, tagline, description, city, district, address,
           handover, price_range, total_units, status, source_class
         ) VALUES (
           'proj_eaton_fail', 'dev_gamuda_land', 'eaton-park', 'Eaton Park Placeholder',
           ?, 'crawl down', ?, ?, ?, ?, ?, ?, 'failed', 'estimated'
         )`,
      )
      .bind(PENDING, PENDING, PENDING, PENDING, PENDING, PENDING, PENDING)
      .run();
    await db
      .prepare(
        `INSERT INTO projects (id, developer_id, slug, name, tagline, city, status, source_class)
         VALUES ('proj_real_draft', 'dev_gamuda_land', 'qa-real-draft', 'Real Draft', 'A real draft', 'HCM', 'draft', 'estimated')`,
      )
      .run();
    await db
      .prepare(
        `INSERT INTO projects (id, developer_id, slug, name, tagline, city, status, source_class)
         VALUES ('proj_active', 'dev_gamuda_land', 'qa-active', 'Active Listing', 'Ready', 'HCM', 'published', 'estimated')`,
      )
      .run();
    await db.prepare(`UPDATE projects SET status = 'active' WHERE slug = 'qa-active'`).run();
    await db
      .prepare(
        `INSERT INTO projects (
           id, developer_id, slug, name, tagline, city, district, address, handover, price_range, total_units, status, source_class
         ) VALUES (
           'proj_ph_draft', 'dev_gamuda_land', 'qa-placeholder-draft', 'Stub',
           ?, ?, ?, ?, ?, ?, ?, 'draft', 'estimated'
         )`,
      )
      .bind(PENDING, PENDING, PENDING, PENDING, PENDING, PENDING, PENDING)
      .run();

    const env = buildEnv(db);
    const token = await adminToken(db);
    const approved = await worker.fetch(
      new Request("https://ancu.test/api/admin/projects/approve-all", {
        method: "POST",
        headers: authHeaders(token),
      }),
      env,
    );
    expect(approved.status).toBe(200);
    const approvedBody = (await approved.json()) as { projectUpdates: number };
    expect(approvedBody.projectUpdates).toBe(2);

    const statuses = await db
      .prepare(`SELECT slug, name, tagline, status FROM projects ORDER BY slug`)
      .all<{ slug: string; name: string; tagline: string; status: string }>();
    const row = (slug: string) => statuses.results?.find((item) => item.slug === slug);
    expect(row("qa-published")).toMatchObject({
      name: "Stay Published",
      tagline: "Keep me",
      status: "published",
    });
    expect(row("eaton-park")).toMatchObject({ status: "failed", tagline: PENDING });
    expect(row("qa-real-draft")?.status).toBe("published");
    expect(row("qa-active")?.status).toBe("published");
    expect(row("qa-placeholder-draft")).toMatchObject({ status: "draft", tagline: PENDING });

    const publicEaton = await worker.fetch(new Request("https://ancu.test/api/projects/eaton-park"), env);
    expect(publicEaton.status).toBe(200);
    const eatonBody = (await publicEaton.json()) as { source: string; project: { tagline?: string; name: string } };
    expect(eatonBody.source).toBe("seed");
    expect(eatonBody.project.tagline).not.toBe(PENDING);
    expect(eatonBody.project.name).toBe("Eaton Park");

    const publicDraft = await worker.fetch(new Request("https://ancu.test/api/projects/qa-real-draft"), env);
    expect(publicDraft.status).toBe(200);
    const hiddenStub = await worker.fetch(
      new Request("https://ancu.test/api/projects/qa-placeholder-draft"),
      env,
    );
    expect(hiddenStub.status).toBe(404);

    await upsertSynthesizedProject(
      db,
      {
        name: "OVERWRITE",
        slug: "qa-published",
        tagline: PENDING,
        description: "should not land",
        city: PENDING,
        district: PENDING,
        address: PENDING,
        handover: PENDING,
        priceRange: PENDING,
        totalUnits: PENDING,
        amenities: [],
        apartmentTypes: [],
        nearbyPlaces: [],
        sources: [],
        researchNotes: "placeholder",
        showroom: { lightingDefault: "day", materialPaletteLabel: PENDING, hotspots: [] },
      },
      "failed",
    );
    const kept = await db
      .prepare(`SELECT name, tagline, status FROM projects WHERE slug = 'qa-published'`)
      .first<{ name: string; tagline: string; status: string }>();
    expect(kept).toMatchObject({ name: "Stay Published", tagline: "Keep me", status: "published" });
    const amenity = await db
      .prepare(`SELECT name FROM amenities WHERE project_id = 'proj_pub'`)
      .first<{ name: string }>();
    expect(amenity?.name).toBe("Công viên thật");
  });
});
