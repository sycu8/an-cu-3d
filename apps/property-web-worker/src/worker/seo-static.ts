import { EDITORIAL_BLOG_POSTS } from "../data/blog-posts";
import { getProjectBySlug } from "../data/gamuda-projects";
import { CANONICAL_HOST, CANONICAL_ORIGIN, HUB_ORIGIN } from "../seo/site-copy";
import type { Env } from "./types";

export { CANONICAL_HOST, CANONICAL_ORIGIN };

const SITEMAP_PATHS = [
  "/",
  "/projects",
  "/map",
  "/compare",
  "/tools",
  "/tools/loan",
  "/tools/investment",
  "/blog",
  "/blog/cho-xac-minh-khong-phai-o-trong",
  "/blog/showroom-anh-sang-vat-lieu-diem-nong",
  "/blog/so-sanh-du-an-khong-bia-thoi-gian",
  "/blog/nhin-gan-du-an-dang-co-tren-ancu",
] as const;

export function robotsTxtBody(): string {
  return `User-agent: *\nAllow: /\n\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${CANONICAL_ORIGIN}/sitemap.xml\n`;
}

export function sitemapXmlBody(): string {
  const urls = SITEMAP_PATHS.map((path) => {
    const loc = `${CANONICAL_ORIGIN}${path}`;
    return `  <url><loc>${loc}</loc></url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function llmsTxtBody(): string {
  return `# AnCư 3D

> Hiểu căn nhà trước khi gọi là nhà. Understand the home before you call it home.

AnCư 3D là ứng dụng xem mặt bằng, không gian 3D và so sánh dự án nhà ở. Trang canonical là ${CANONICAL_ORIGIN}. Tác giả và nhà xuất bản là ${HUB_ORIGIN}/#person (Cường Lê Sỹ), trong showcase cá nhân Orange Cloud. Đây không phải sản phẩm của Cloudflare, Inc.

Số liệu chưa có nguồn được ghi là chờ xác minh. Mặt bằng mẫu là minh họa cho đến khi có hồ sơ đã đối chiếu. Trang không bịa thời gian di chuyển.

## Tiếng Việt

- [Trang chủ](${CANONICAL_ORIGIN}/): Tìm theo khu vực, công cụ vay, bản đồ và dự án nổi bật.
- [Dự án](${CANONICAL_ORIGIN}/projects): Danh sách dự án kèm nguồn dữ liệu.
- [So sánh](${CANONICAL_ORIGIN}/compare): Đối chiếu tối đa ba dự án theo trọng số của bạn.
- [Bản đồ](${CANONICAL_ORIGIN}/map): Tiện ích xung quanh, khoảng cách thẳng, không có ETA bịa.
- [Công cụ](${CANONICAL_ORIGIN}/tools): Ước tính khoản vay và mức phù hợp.
- [Blog](${CANONICAL_ORIGIN}/blog): Cách đọc mặt bằng và dữ liệu.

## English

- [Home](${CANONICAL_ORIGIN}/): Search by area, loan tools, a map, and featured projects.
- [Projects](${CANONICAL_ORIGIN}/projects): Project list with sourced data.
- [Compare](${CANONICAL_ORIGIN}/compare): Compare up to three projects using your own weights.
- [Map](${CANONICAL_ORIGIN}/map): Nearby amenities and straight-line distance, with no invented travel time.
- [Tools](${CANONICAL_ORIGIN}/tools): Loan estimate and fit tools.
- [Blog](${CANONICAL_ORIGIN}/blog): Notes on reading floor plans and data.

## Orange Cloud

- [Orange Cloud](${HUB_ORIGIN}/): Hub của các dự án cá nhân.
- [Onboarding](https://onboarding.orangecloud.vn/): Lộ trình học Cloudflare.
- [CF Ready](https://ready.orangecloud.vn/): Kiểm tra sẵn sàng trước khi deploy.
- [Insights](https://blog.orangecloud.vn/): Ghi chú kỹ thuật.
`;
}

const NOT_FOUND_HTML = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Không tìm thấy trang — AnCư 3D</title>
  <meta name="robots" content="noindex" />
</head>
<body>
  <h1>Không tìm thấy trang</h1>
  <p>Đường dẫn này không có trên AnCư 3D.</p>
  <p lang="en">This page is not on AnCư 3D.</p>
  <p><a href="/">Về trang chủ</a> · <a href="${HUB_ORIGIN}/">Orange Cloud</a></p>
</body>
</html>
`;

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

function safeSegment(value: string): boolean {
  return value.length > 0 && value !== "." && value !== ".." && !value.includes("\\");
}

/**
 * URL shapes that can receive index.html. A /projects/<slug> or /blog/<slug>
 * shape still 404s when that slug is not public.
 */
export function isSpaRoute(pathname: string): boolean {
  const path = normalizePath(pathname);
  if (path === "/") return true;
  const parts = path.split("/").slice(1);
  if (parts.some((part) => !safeSegment(part))) return false;
  if (parts.length === 1 && ["projects", "map", "compare", "tools", "admin", "blog"].includes(parts[0]!)) {
    return true;
  }
  if (parts.length === 2 && parts[0] === "tools" && (parts[1] === "loan" || parts[1] === "investment")) {
    return true;
  }
  if (parts.length === 2 && parts[0] === "blog") return true;
  if (parts.length === 2 && parts[0] === "projects") return true;
  if (
    parts.length === 3 &&
    parts[0] === "projects" &&
    (parts[2] === "3d" || parts[2] === "apartments" || parts[2] === "showroom")
  ) {
    return true;
  }
  if (parts.length === 4 && parts[0] === "projects" && parts[2] === "apartments") return true;
  return false;
}

function routeParts(pathname: string): string[] | null {
  const path = normalizePath(pathname);
  if (path === "/") return [];
  const parts = path.split("/").slice(1);
  if (parts.some((part) => !safeSegment(part))) return null;
  return parts;
}

/** Published D1 row, or the seed catalog when D1 has no row. */
async function publishedProjectExists(env: Env, slug: string): Promise<boolean> {
  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        `SELECT slug FROM projects WHERE slug = ? AND status = 'published'`,
      )
        .bind(slug)
        .first<{ slug: string }>();
      if (row) return true;
    } catch {
      /* D1 missing — the seed catalog is the public list. */
    }
  }
  return Boolean(getProjectBySlug(slug));
}

/**
 * A stored row wins: only `published` is public, so an archived editorial
 * slug stays hidden. No row falls through to the curated posts.
 */
async function publishedBlogExists(env: Env, slug: string): Promise<boolean> {
  if (env.DB) {
    try {
      const row = await env.DB.prepare(`SELECT status FROM blog_posts WHERE slug = ?`)
        .bind(slug)
        .first<{ status: string }>();
      if (row) return row.status === "published";
    } catch {
      /* D1 missing — the curated posts are the public list. */
    }
  }
  return EDITORIAL_BLOG_POSTS.some((post) => post.slug === slug && post.status === "published");
}

async function isPublicSpaRoute(pathname: string, env: Env): Promise<boolean> {
  if (!isSpaRoute(pathname)) return false;
  const parts = routeParts(pathname);
  if (!parts) return false;
  if (parts[0] === "projects" && parts.length >= 2) {
    return publishedProjectExists(env, decodeURIComponent(parts[1]!));
  }
  if (parts[0] === "blog" && parts.length === 2) {
    return publishedBlogExists(env, decodeURIComponent(parts[1]!));
  }
  return true;
}

function seoDocument(pathname: string): { body: string; contentType: string } | null {
  const path = normalizePath(pathname);
  if (path === "/robots.txt") {
    return { body: robotsTxtBody(), contentType: "text/plain; charset=utf-8" };
  }
  if (path === "/sitemap.xml") {
    return { body: sitemapXmlBody(), contentType: "application/xml; charset=utf-8" };
  }
  if (path === "/llms.txt") {
    return { body: llmsTxtBody(), contentType: "text/plain; charset=utf-8" };
  }
  return null;
}

export function notFoundPage(method: string): Response {
  return new Response(method === "HEAD" ? null : NOT_FOUND_HTML, {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

async function spaIndexResponse(request: Request, env: Env): Promise<Response> {
  if (!env.STATIC_ASSETS) return notFoundPage(request.method);
  const indexUrl = new URL(request.url);
  indexUrl.pathname = "/index.html";
  indexUrl.search = "";
  const asset = await env.STATIC_ASSETS.fetch(
    new Request(indexUrl.toString(), { method: request.method }),
  );
  const contentType = (asset.headers.get("content-type") ?? "").toLowerCase();
  if (asset.status !== 200 || !contentType.includes("text/html")) {
    await asset.body?.cancel();
    return notFoundPage(request.method);
  }
  return asset;
}

/**
 * Real robots.txt, sitemap.xml and llms.txt, then the SPA shell for known
 * routes. Unknown paths get a 404 document, never index.html.
 */
export async function publicPageResponse(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname;
  const doc = seoDocument(path);
  if (doc) {
    return new Response(request.method === "HEAD" ? null : doc.body, {
      status: 200,
      headers: {
        "content-type": doc.contentType,
        "cache-control": "public, max-age=3600",
      },
    });
  }
  if (await isPublicSpaRoute(path, env)) return spaIndexResponse(request, env);
  return notFoundPage(request.method);
}

export function withNoindex(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
