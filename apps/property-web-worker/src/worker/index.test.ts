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
    expect(body).toMatchObject({ status: "ok", aiPath: "none", aiGateway: false });
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

  it("reports the active AI path", async () => {
    const direct = await worker.fetch(
      new Request("http://localhost/api/health"),
      { AI: { run: async () => ({ response: "" }) } } as unknown as Env,
    );
    expect(await direct.json()).toMatchObject({ aiPath: "workers_ai", aiGateway: false });

    const gateway = await worker.fetch(
      new Request("http://localhost/api/health"),
      {
        AI: { run: async () => ({ response: "" }) },
        AI_GATEWAY_ACCOUNT_ID: "acc",
        AI_GATEWAY_ID: "gw",
      } as unknown as Env,
    );
    expect(await gateway.json()).toMatchObject({ aiPath: "ai_gateway", aiGateway: true });
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

  it("returns 404 for an unknown /assets chunk instead of SPA HTML", async () => {
    const missing = await worker.fetch(
      new Request("http://localhost/assets/index-does-not-exist.js"),
      env,
    );
    expect(missing.status).toBe(404);
    expect(missing.headers.get("content-type")).toContain("text/plain");
    expect(await missing.text()).toBe("Not Found");

    const spaFallback = {
      STATIC_ASSETS: {
        fetch: async () =>
          new Response("<!doctype html><html><body>spa</body></html>", {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          }),
      },
    } as unknown as Env;
    const html = await worker.fetch(
      new Request("http://localhost/assets/index-stale.js"),
      spaFallback,
    );
    expect(html.status).toBe(404);
    expect(await html.text()).toBe("Not Found");

    const present = {
      STATIC_ASSETS: {
        fetch: async () =>
          new Response("export const chunk = 1;\n", {
            status: 200,
            headers: { "content-type": "application/javascript; charset=utf-8" },
          }),
      },
    } as unknown as Env;
    const asset = await worker.fetch(new Request("http://localhost/assets/index-real.js"), present);
    expect(asset.status).toBe(200);
    expect(asset.headers.get("content-type")).toContain("javascript");
    expect(await asset.text()).toContain("export const chunk");

    const revalidated = {
      STATIC_ASSETS: {
        fetch: async () =>
          new Response(null, {
            status: 304,
            headers: {
              etag: '"chunk-real"',
              "cache-control": "public, max-age=0, must-revalidate",
            },
          }),
      },
    } as unknown as Env;
    const notModified = await worker.fetch(
      new Request("http://localhost/assets/index-real.js", {
        headers: { "if-none-match": '"chunk-real"' },
      }),
      revalidated,
    );
    expect(notModified.status).toBe(304);
    expect(notModified.headers.get("etag")).toBe('"chunk-real"');
    expect(await notModified.text()).toBe("");

    const errored = {
      STATIC_ASSETS: {
        fetch: async () => new Response("upstream", { status: 502 }),
      },
    } as unknown as Env;
    const upstream = await worker.fetch(
      new Request("http://localhost/assets/index-real.js"),
      errored,
    );
    expect(upstream.status).toBe(502);
    expect(await upstream.text()).toBe("upstream");
  });

  it("rejects admin routes without a session bearer", async () => {
    const response = await worker.fetch(
      new Request("http://localhost/api/admin/projects"),
      env,
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthorized" });
  });

  it("serves robots.txt, sitemap.xml and llms.txt instead of the SPA shell", async () => {
    const spa = {
      STATIC_ASSETS: {
        fetch: async () =>
          new Response('<!doctype html><div id="root"></div>', {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          }),
      },
    } as unknown as Env;

    const robots = await worker.fetch(new Request("https://home.orangecloud.vn/robots.txt"), spa);
    expect(robots.status).toBe(200);
    expect(robots.headers.get("content-type")).toContain("text/plain");
    const robotsBody = await robots.text();
    expect(robotsBody).toContain("Sitemap: https://home.orangecloud.vn/sitemap.xml");
    expect(robotsBody).toContain("Disallow: /admin");
    expect(robotsBody).not.toContain('id="root"');
    expect(robots.headers.get("x-robots-tag")).toBeNull();

    const sitemap = await worker.fetch(new Request("https://home.orangecloud.vn/sitemap.xml"), spa);
    expect(sitemap.status).toBe(200);
    expect(sitemap.headers.get("content-type")).toContain("xml");
    const sitemapBody = await sitemap.text();
    expect(sitemapBody).toContain("https://home.orangecloud.vn/projects");
    expect(sitemapBody).toContain("https://home.orangecloud.vn/blog/nhin-gan-du-an-dang-co-tren-ancu");
    expect(sitemapBody).not.toContain("/admin");
    expect(sitemapBody).not.toContain('id="root"');

    const llms = await worker.fetch(new Request("https://home.orangecloud.vn/llms.txt"), spa);
    expect(llms.status).toBe(200);
    const llmsBody = await llms.text();
    expect(llmsBody).toContain("https://orangecloud.vn/#person");
    expect(llmsBody).toContain("https://onboarding.orangecloud.vn/");
    expect(llmsBody).not.toContain('id="root"');

    const head = await worker.fetch(new Request("https://home.orangecloud.vn/llms.txt", { method: "HEAD" }), spa);
    expect(head.status).toBe(200);
    expect(await head.text()).toBe("");

    const workersDev = await worker.fetch(
      new Request("https://ancu-property-web.example.workers.dev/robots.txt"),
      spa,
    );
    expect(workersDev.status).toBe(200);
    expect(workersDev.headers.get("x-robots-tag")).toContain("noindex");
  });

  it("returns the SPA shell for known routes and 404 for unknown routes", async () => {
    const spa = {
      STATIC_ASSETS: {
        fetch: async (request: Request) => {
          const url = new URL(request.url);
          if (url.pathname === "/index.html") {
            return new Response('<!doctype html><div id="root"></div>', {
              status: 200,
              headers: { "content-type": "text/html; charset=utf-8" },
            });
          }
          return new Response("missing", { status: 404, headers: { "content-type": "text/plain" } });
        },
      },
    } as unknown as Env;

    const home = await worker.fetch(new Request("https://home.orangecloud.vn/"), spa);
    expect(home.status).toBe(200);
    expect(await home.text()).toContain('id="root"');
    expect(home.headers.get("content-security-policy")).toBeNull();

    const project = await worker.fetch(
      new Request("https://home.orangecloud.vn/projects/eaton-park/apartments/1br-b"),
      spa,
    );
    expect(project.status).toBe(200);

    const missing = await worker.fetch(
      new Request("https://home.orangecloud.vn/khong-co-trang-nay"),
      spa,
    );
    expect(missing.status).toBe(404);
    const body = await missing.text();
    expect(body).toContain("Không tìm thấy trang");
    expect(body).not.toContain('id="root"');
    expect(missing.headers.get("x-robots-tag")).toContain("noindex");

    const deep = await worker.fetch(
      new Request("https://home.orangecloud.vn/projects/eaton-park/khong-co"),
      spa,
    );
    expect(deep.status).toBe(404);

    const preview = await worker.fetch(new Request("https://preview.example/projects"), spa);
    expect(preview.status).toBe(200);
    expect(preview.headers.get("x-robots-tag")).toContain("noindex");
  });

});
