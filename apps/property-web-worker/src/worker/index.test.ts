import { describe, expect, it } from "vitest";
import worker from "./index";
import type { Env } from "./types";

const env = {} as Env;

type BlogMemoryRow = Record<string, unknown> & { status?: string };

/** Enough of D1 for editorial insert-if-missing and public reads. */
function createBlogMemoryDb() {
  const posts = new Map<string, BlogMemoryRow>();

  function prepare(sql: string) {
    let binds: unknown[] = [];
    const api = {
      bind(...args: unknown[]) {
        binds = args;
        return api;
      },
      async first() {
        if (/WHERE slug = \?/i.test(sql)) return posts.get(String(binds[0])) ?? null;
        return null;
      },
      async all() {
        return { results: [...posts.values()] };
      },
      async run() {
        if (!/INSERT INTO blog_posts/i.test(sql)) return { success: true };
        const slug = String(binds[1]);
        const publish = Number(binds[12]) === 1;
        const explicit = binds[13] == null || binds[13] === "" ? null : String(binds[13]);
        const now = "2026-10-18 09:00:00";
        const incomingPublished = publish ? explicit || now : null;
        const existing = posts.get(slug);
        if (!existing) {
          posts.set(slug, {
            id: binds[0],
            slug,
            title: binds[2],
            excerpt: binds[3],
            body_markdown: binds[4],
            cover_r2_key: binds[5],
            cover_url: binds[6],
            project_slugs_json: binds[7],
            status: String(binds[8]),
            locale: binds[9],
            seo_title: binds[10],
            seo_description: binds[11],
            published_at: incomingPublished,
            created_at: now,
            updated_at: now,
          });
          return { success: true };
        }
        const status = String(binds[8]);
        posts.set(slug, {
          ...existing,
          title: binds[2],
          excerpt: binds[3],
          body_markdown: binds[4],
          status,
          seo_title: binds[10],
          seo_description: binds[11],
          published_at:
            status === "published"
              ? existing.published_at || incomingPublished || now
              : existing.published_at,
          updated_at: now,
        });
        return { success: true };
      },
    };
    return api;
  }

  return { posts, prepare };
}

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

  it("lists curated blog posts when D1 is absent", async () => {
    const response = await worker.fetch(new Request("http://localhost/api/blog"), env);
    const body = (await response.json()) as { posts: { slug: string; status: string }[] };
    expect(response.status).toBe(200);
    expect(body.posts.map((post) => post.slug).sort()).toEqual(
      [
        "cho-xac-minh-khong-phai-o-trong",
        "nhin-gan-du-an-dang-co-tren-ancu",
        "showroom-anh-sang-vat-lieu-diem-nong",
        "so-sanh-du-an-khong-bia-thoi-gian",
      ].sort(),
    );
    expect(body.posts.every((post) => post.status === "published")).toBe(true);
  });

  it("returns a curated post by slug and 404s unknown slugs", async () => {
    const found = await worker.fetch(
      new Request("http://localhost/api/blog/nhin-gan-du-an-dang-co-tren-ancu"),
      env,
    );
    const body = (await found.json()) as { post: { title: string; seoTitle: string } };
    expect(found.status).toBe(200);
    expect(body.post.title).toContain("AnCư");
    expect(body.post.seoTitle.length).toBeGreaterThan(8);

    const missing = await worker.fetch(new Request("http://localhost/api/blog/khong-co-bai-nay"), env);
    expect(missing.status).toBe(404);
  });

  it("does not republish a curated slug an admin has archived", async () => {
    const db = createBlogMemoryDb();
    const blogEnv = { DB: db } as unknown as Env;
    const first = await worker.fetch(new Request("http://localhost/api/blog"), blogEnv);
    expect(first.status).toBe(200);
    expect(db.posts.size).toBe(4);

    const row = db.posts.get("cho-xac-minh-khong-phai-o-trong");
    expect(row).toBeTruthy();
    row!.status = "archived";

    const second = await worker.fetch(new Request("http://localhost/api/blog"), blogEnv);
    const body = (await second.json()) as { posts: { slug: string }[] };
    expect(body.posts.map((post) => post.slug)).not.toContain("cho-xac-minh-khong-phai-o-trong");
    expect(db.posts.get("cho-xac-minh-khong-phai-o-trong")?.status).toBe("archived");

    const hidden = await worker.fetch(
      new Request("http://localhost/api/blog/cho-xac-minh-khong-phai-o-trong"),
      blogEnv,
    );
    expect(hidden.status).toBe(404);
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
