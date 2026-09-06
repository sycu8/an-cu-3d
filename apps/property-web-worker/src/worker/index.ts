import { slugifyProjectName } from "@ancu/shared";
import { getProjectBySlug, getProjectSummaries } from "../data/gamuda-projects";
import {
  extractBearerToken,
  hashPassword,
  validateNewPassword,
} from "./auth";
import {
  assist2dTo3d,
  editImageAsset,
  generateBlogDraft,
  generateImageAsset,
  runFactualQa,
} from "./ai/pipeline";
import {
  changeAdminPassword,
  createAdminSession,
  deleteAdminSession,
  loginAdmin,
  resolveAdminSession,
  type AdminAuthContext,
} from "./db/admin";
import {
  getPostBySlug,
  listAllPosts,
  listPublishedPosts,
  upsertBlogPost,
} from "./db/blog";
import { createBuildJob, getBuildJob, listBuildJobs } from "./db/jobs";
import { getDbProjectBySlug, listDbProjectSummaries } from "./db/projects";
import { runProjectBuild } from "./project-build";
import { serveMedia, withMediaUrl } from "./media";
import { toPublicDetail, toPublicSummary } from "./public-project";
import type { Env } from "./types";

function securityHeaders(requestId: string): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-Request-Id": requestId,
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' blob: data: https://images.unsplash.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org; connect-src 'self' https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://gateway.ai.cloudflare.com; font-src 'self' https://fonts.gstatic.com; object-src 'none'; frame-ancestors 'none'; base-uri 'self'",
  };
}

function withSecurityHeaders(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(securityHeaders(requestId))) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function json(
  data: unknown,
  requestId: string,
  status = 200,
  cache = "public, max-age=60",
): Response {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": cache,
  });
  for (const [key, value] of Object.entries(securityHeaders(requestId))) {
    headers.set(key, value);
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function notFound(message: string, requestId: string): Response {
  return json({ error: message }, requestId, 404, "no-store");
}

function methodNotAllowed(requestId: string): Response {
  return json({ error: "Method Not Allowed" }, requestId, 405, "no-store");
}

function unauthorized(requestId: string): Response {
  return json({ error: "unauthorized" }, requestId, 401, "no-store");
}

function logRequest(
  requestId: string,
  method: string,
  path: string,
  status: number,
  ms: number,
): void {
  console.log(
    JSON.stringify({
      level: status >= 500 ? "error" : status >= 400 ? "warn" : "info",
      requestId,
      method,
      path,
      status,
      ms,
    }),
  );
}

async function mergeProjects(env: Env) {
  const seed = getProjectSummaries();
  let dbProjects: Awaited<ReturnType<typeof listDbProjectSummaries>> = [];
  try {
    dbProjects = await listDbProjectSummaries(env.DB);
  } catch {
    dbProjects = [];
  }
  const bySlug = new Map(seed.map((p) => [p.slug, p]));
  for (const p of dbProjects) bySlug.set(p.slug, p);
  return {
    projects: [...bySlug.values()],
    source: dbProjects.length ? "d1+seed" : "seed",
  };
}

/** Buyer-facing list: pending / secondary research / provenance stripped. */
async function mergePublicProjects(env: Env) {
  const merged = await mergeProjects(env);
  return {
    projects: merged.projects.map(toPublicSummary),
    source: merged.source,
  };
}

async function resolveProject(env: Env, slug: string) {
  try {
    const fromDb = await getDbProjectBySlug(env.DB, slug);
    if (fromDb) {
      return { project: fromDb, source: "d1" as const };
    }
  } catch {
    /* fall through */
  }
  const seed = getProjectBySlug(slug);
  if (seed) {
    return { project: seed, source: "seed" as const };
  }
  return null;
}

async function resolvePublicProject(env: Env, slug: string) {
  const resolved = await resolveProject(env, slug);
  if (!resolved) return null;
  return {
    project: toPublicDetail(resolved.project),
    source: resolved.source,
  };
}

function schedule(ctx: ExecutionContext | undefined, task: Promise<unknown>): void {
  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(task);
  } else {
    void task;
  }
}

function mustChangePasswordBlocked(path: string): boolean {
  return (
    path !== "/api/admin/me" &&
    path !== "/api/admin/logout" &&
    path !== "/api/admin/change-password"
  );
}

async function handleAdmin(
  request: Request,
  env: Env,
  ctx: ExecutionContext | undefined,
  requestId: string,
): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (!path.startsWith("/api/admin")) return null;

  // Public auth endpoints (no session yet)
  if (path === "/api/admin/login" && request.method === "POST") {
    let body: { username?: string; password?: string };
    try {
      body = (await request.json()) as { username?: string; password?: string };
    } catch {
      return json({ error: "invalid_json" }, requestId, 400, "no-store");
    }
    const username = body.username?.trim() ?? "";
    const password = body.password ?? "";
    if (!username || !password) {
      return json({ error: "credentials_required" }, requestId, 400, "no-store");
    }
    try {
      const result = await loginAdmin(env.DB, username, password);
      if (!result.ok) {
        return json({ error: result.error }, requestId, 401, "no-store");
      }
      return json(
        {
          token: result.token,
          username: result.username,
          mustChangePassword: result.mustChangePassword,
        },
        requestId,
        200,
        "no-store",
      );
    } catch (err) {
      console.error("admin login failed", err);
      return json({ error: "auth_unavailable" }, requestId, 503, "no-store");
    }
  }

  const bearer = extractBearerToken(request.headers.get("Authorization"));
  if (!bearer) return unauthorized(requestId);

  let auth: AdminAuthContext | null = null;
  try {
    auth = await resolveAdminSession(env.DB, bearer);
  } catch (err) {
    console.error("admin session resolve failed", err);
    return json({ error: "auth_unavailable" }, requestId, 503, "no-store");
  }
  if (!auth) return unauthorized(requestId);

  const mustChange = auth.user.must_change_password === 1;

  if (path === "/api/admin/me" && request.method === "GET") {
    return json(
      {
        username: auth.user.username,
        mustChangePassword: mustChange,
      },
      requestId,
      200,
      "no-store",
    );
  }

  if (path === "/api/admin/logout" && request.method === "POST") {
    await deleteAdminSession(env.DB, auth.session.id);
    return json({ ok: true }, requestId, 200, "no-store");
  }

  if (path === "/api/admin/change-password" && request.method === "POST") {
    let body: { currentPassword?: string; newPassword?: string };
    try {
      body = (await request.json()) as {
        currentPassword?: string;
        newPassword?: string;
      };
    } catch {
      return json({ error: "invalid_json" }, requestId, 400, "no-store");
    }
    const currentPassword = body.currentPassword ?? "";
    const newPassword = body.newPassword ?? "";
    if (!currentPassword || !newPassword) {
      return json({ error: "password_required" }, requestId, 400, "no-store");
    }
    const validationError = validateNewPassword(newPassword, auth.user.username);
    if (validationError) {
      return json({ error: validationError }, requestId, 400, "no-store");
    }
    const newHash = await hashPassword(newPassword);
    const result = await changeAdminPassword(
      env.DB,
      auth.user,
      currentPassword,
      newHash,
    );
    if (!result.ok) {
      return json({ error: result.error }, requestId, 401, "no-store");
    }
    const { token } = await createAdminSession(env.DB, auth.user.id);
    return json(
      {
        ok: true,
        token,
        username: auth.user.username,
        mustChangePassword: false,
      },
      requestId,
      200,
      "no-store",
    );
  }

  if (mustChange && mustChangePasswordBlocked(path)) {
    return json(
      { error: "password_change_required", mustChangePassword: true },
      requestId,
      403,
      "no-store",
    );
  }

  if (path === "/api/admin/projects" && request.method === "GET") {
    const merged = await mergeProjects(env);
    const jobs = await listBuildJobs(env.DB).catch(() => []);
    return json({ ...merged, jobs }, requestId, 200, "no-store");
  }

  if (path === "/api/admin/projects" && request.method === "POST") {
    let body: { name?: string };
    try {
      body = (await request.json()) as { name?: string };
    } catch {
      return json({ error: "invalid_json" }, requestId, 400, "no-store");
    }
    const name = body.name?.trim();
    if (!name || name.length < 2) {
      return json({ error: "name_required" }, requestId, 400, "no-store");
    }
    const slug = slugifyProjectName(name);
    const id = crypto.randomUUID();
    await createBuildJob(env.DB, { id, name, slug });
    // No rate limit / timeout for this orchestration
    schedule(ctx, runProjectBuild(env, { id, name, slug }));
    const job = await getBuildJob(env.DB, id);
    return json({ job }, requestId, 202, "no-store");
  }

  if (path === "/api/admin/jobs" && request.method === "GET") {
    const jobs = await listBuildJobs(env.DB);
    return json({ jobs }, requestId, 200, "no-store");
  }

  const jobMatch = path.match(/^\/api\/admin\/jobs\/([^/]+)$/);
  if (jobMatch && request.method === "GET") {
    const job = await getBuildJob(env.DB, decodeURIComponent(jobMatch[1]));
    if (!job) return notFound("job_not_found", requestId);
    return json({ job }, requestId, 200, "no-store");
  }

  if (path === "/api/admin/blog" && request.method === "GET") {
    const posts = await listAllPosts(env.DB);
    return json({ posts }, requestId, 200, "no-store");
  }

  if (path === "/api/admin/blog/generate" && request.method === "POST") {
    const merged = await mergeProjects(env);
    let body: { projectSlugs?: string[]; publish?: boolean } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      body = {};
    }
    const selected = body.projectSlugs?.length
      ? merged.projects.filter((p) => body.projectSlugs!.includes(p.slug))
      : merged.projects.slice(0, 5);

    const details = [];
    for (const p of selected) {
      const full = await resolveProject(env, p.slug);
      details.push({
        name: p.name,
        slug: p.slug,
        description:
          full?.project && "description" in full.project
            ? full.project.description
            : undefined,
      });
    }

    const draft = await generateBlogDraft(env, details);
    const slug = `tuan-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}`;
    const id = crypto.randomUUID();
    const cover = await generateImageAsset(
      env,
      draft.coverPrompt,
      `blog/${slug}/cover`,
    );
    const status = body.publish ? "published" : "draft";
    await upsertBlogPost(env.DB, {
      id,
      slug,
      title: draft.title,
      excerpt: draft.excerpt,
      bodyMarkdown: draft.bodyMarkdown,
      projectSlugs: selected.map((p) => p.slug),
      status,
      seoTitle: draft.seoTitle,
      seoDescription: draft.seoDescription,
      coverR2Key: cover.r2Key,
      publish: Boolean(body.publish),
    });
    const post = await getPostBySlug(env.DB, slug);
    return json({ post, cover }, requestId, 201, "no-store");
  }

  if (path === "/api/admin/assist/2d3d" && request.method === "POST") {
    let body: { projectSlug?: string; imageDescription?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json({ error: "invalid_json" }, requestId, 400, "no-store");
    }
    if (!body.projectSlug || !body.imageDescription) {
      return json(
        { error: "projectSlug_and_imageDescription_required" },
        requestId,
        400,
        "no-store",
      );
    }
    const result = await assist2dTo3d(env, body.projectSlug, body.imageDescription);
    return json({ result }, requestId, 200, "no-store");
  }


  if (path === "/api/admin/images/generate" && request.method === "POST") {
    let body: { prompt?: string; key?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json({ error: "invalid_json" }, requestId, 400, "no-store");
    }
    if (!body.prompt?.trim()) {
      return json({ error: "prompt_required" }, requestId, 400, "no-store");
    }
    const key = body.key?.trim() || `media/generated/${crypto.randomUUID()}.jpg`;
    const result = await generateImageAsset(env, body.prompt.trim(), key);
    return json({ result: withMediaUrl(result) }, requestId, 200, "no-store");
  }

  if (path === "/api/admin/images/edit" && request.method === "POST") {
    let body: { prompt?: string; imageBase64?: string; key?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json({ error: "invalid_json" }, requestId, 400, "no-store");
    }
    if (!body.prompt?.trim() || !body.imageBase64) {
      return json({ error: "prompt_and_imageBase64_required" }, requestId, 400, "no-store");
    }
    const key = body.key?.trim() || `media/edited/${crypto.randomUUID()}.jpg`;
    const result = await editImageAsset(env, body.prompt.trim(), body.imageBase64, key);
    return json({ result: withMediaUrl(result) }, requestId, 200, "no-store");
  }

  if (path === "/api/admin/qa/factual" && request.method === "POST") {
    let body: { claims?: string; sources?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return json({ error: "invalid_json" }, requestId, 400, "no-store");
    }
    if (!body.claims?.trim()) {
      return json({ error: "claims_required" }, requestId, 400, "no-store");
    }
    const result = await runFactualQa(env, body.claims, body.sources ?? "");
    return json({ result }, requestId, 200, "no-store");
  }

  const adminBlogMatch = path.match(/^\/api\/admin\/blog\/([^/]+)$/);
  if (adminBlogMatch && request.method === "GET") {
    const post = await getPostBySlug(env.DB, decodeURIComponent(adminBlogMatch[1]));
    if (!post) return notFound("post_not_found", requestId);
    return json({ post }, requestId, 200, "no-store");
  }

  if (adminBlogMatch && request.method === "POST") {
    let body: { publish?: boolean };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      body = {};
    }
    const slug = decodeURIComponent(adminBlogMatch[1]);
    const existing = await getPostBySlug(env.DB, slug);
    if (!existing) return notFound("post_not_found", requestId);
    if (body.publish) {
      await upsertBlogPost(env.DB, {
        id: existing.id,
        slug: existing.slug,
        title: existing.title,
        excerpt: existing.excerpt,
        bodyMarkdown: existing.bodyMarkdown,
        projectSlugs: existing.projectSlugs,
        status: "published",
        seoTitle: existing.seoTitle ?? undefined,
        seoDescription: existing.seoDescription ?? undefined,
        coverR2Key: existing.coverR2Key ?? undefined,
        publish: true,
      });
    }
    const post = await getPostBySlug(env.DB, slug);
    return json({ post }, requestId, 200, "no-store");
  }

  if (path === "/api/admin/projects/approve-all" && request.method === "POST") {
    const result = await env.DB.batch([
      env.DB.prepare(
        `UPDATE apartment_types
         SET source_class = 'estimated',
             provenance = COALESCE(provenance, 'Admin approved sample linkage'),
             validation_summary = 'Đã duyệt hiển thị showroom — số liệu vẫn Chờ xác minh nếu chưa có nguồn',
             updated_at = datetime('now')
         WHERE source_class IN ('pending_verification')
            OR provenance LIKE '%pending verification%'
            OR validation_summary LIKE '%pending%'`,
      ),
      env.DB.prepare(
        `UPDATE nearby_places
         SET source_class = 'estimated',
             provenance = COALESCE(provenance, 'Admin approved sample linkage')
         WHERE source_class IN ('pending_verification')
            OR provenance LIKE '%pending verification%'`,
      ),
      env.DB.prepare(
        `UPDATE projects
         SET status = 'published', updated_at = datetime('now')
         WHERE status != 'published'`,
      ),
    ]);
    return json(
      {
        ok: true,
        apartmentUpdates: result[0].meta.changes ?? 0,
        nearbyUpdates: result[1].meta.changes ?? 0,
        projectUpdates: result[2].meta.changes ?? 0,
      },
      requestId,
      200,
      "no-store",
    );
  }


  return notFound("admin_route_not_found", requestId);
}

async function handleApi(
  request: Request,
  env: Env,
  ctx: ExecutionContext | undefined,
  requestId: string,
): Promise<Response | null> {
  const path = new URL(request.url).pathname;

  const admin = await handleAdmin(request, env, ctx, requestId);
  if (admin) return admin;

  if (path === "/api/health" && request.method === "GET") {
    let dbStatus = "seed";
    try {
      if (env.DB) {
        await env.DB.prepare("SELECT 1").first();
        dbStatus = "ok";
      }
    } catch {
      dbStatus = "unavailable";
    }
    const body: Record<string, unknown> = {
      status: "ok",
      service: "ancu-property-web",
      db: dbStatus,
      aiGateway: Boolean(env.AI_GATEWAY_ACCOUNT_ID && env.AI_GATEWAY_ID),
      r2: Boolean(env.ASSETS),
      images: Boolean(env.IMAGES),
      timestamp: new Date().toISOString(),
    };
    if (env.APP_VERSION) body.version = env.APP_VERSION;
    return json(body, requestId);
  }

  if (path === "/api/projects" && request.method === "GET") {
    return json(await mergePublicProjects(env), requestId);
  }

  const projectMatch = path.match(/^\/api\/projects\/([^/]+)$/);
  if (projectMatch && request.method === "GET") {
    const slug = decodeURIComponent(projectMatch[1]);
    const resolved = await resolvePublicProject(env, slug);
    if (!resolved) return notFound(`Project not found: ${slug}`, requestId);
    return json(resolved, requestId);
  }

  if (path === "/api/blog" && request.method === "GET") {
    try {
      const posts = await listPublishedPosts(env.DB);
      return json({ posts }, requestId);
    } catch {
      return json({ posts: [] }, requestId);
    }
  }

  const blogMatch = path.match(/^\/api\/blog\/([^/]+)$/);
  if (blogMatch && request.method === "GET") {
    try {
      const post = await getPostBySlug(env.DB, decodeURIComponent(blogMatch[1]));
      if (!post || post.status !== "published") return notFound("post_not_found", requestId);
      return json({ post }, requestId);
    } catch {
      return notFound("post_not_found", requestId);
    }
  }

  if (path.startsWith("/api/media/") && (request.method === "GET" || request.method === "HEAD")) {
    return serveMedia(request, env, requestId);
  }

  return null;
}

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    // Weekly blog draft suggestion — never auto-publishes.
    ctx.waitUntil(
      (async () => {
        try {
          const merged = await mergeProjects(env);
          const details = merged.projects.slice(0, 5).map((p) => ({
            name: p.name,
            slug: p.slug,
          }));
          if (!details.length) return;
          const draft = await generateBlogDraft(env, details);
          const slug = `goi-y-tuan-${new Date().toISOString().slice(0, 10)}`;
          const existing = await getPostBySlug(env.DB, slug).catch(() => null);
          if (existing) return;
          const id = crypto.randomUUID();
          const cover = await generateImageAsset(
            env,
            draft.coverPrompt,
            `blog/${slug}/cover`,
          );
          await upsertBlogPost(env.DB, {
            id,
            slug,
            title: `[Gợi ý] ${draft.title}`,
            excerpt: draft.excerpt,
            bodyMarkdown: draft.bodyMarkdown,
            projectSlugs: details.map((p) => p.slug),
            status: "draft",
            seoTitle: draft.seoTitle,
            seoDescription: draft.seoDescription,
            coverR2Key: cover.r2Key,
            publish: false,
          });
        } catch (err) {
          console.error("scheduled blog draft failed", err);
        }
      })(),
    );
  },

  async fetch(
    request: Request,
    env: Env,
    ctx?: ExecutionContext,
  ): Promise<Response> {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    const url = new URL(request.url);
    const path = url.pathname;

    let response: Response;

    if (path.startsWith("/api/")) {
      const isAdminMutating =
        path.startsWith("/api/admin") &&
        request.method !== "GET" &&
        request.method !== "HEAD";
      const isPublicGet = request.method === "GET" || request.method === "HEAD";

      if (!isPublicGet && !isAdminMutating) {
        response = methodNotAllowed(requestId);
      } else {
        const apiResponse = await handleApi(request, env, ctx, requestId);
        response = apiResponse ?? notFound("Not Found", requestId);
      }
    } else if (request.method !== "GET" && request.method !== "HEAD") {
      response = new Response("Method Not Allowed", { status: 405 });
    } else {
      // Non-API GETs are served by Workers Static Assets when
      // assets.run_worker_first=["/api/*"] (see wrangler.jsonc). This branch is
      // only reached if the Worker is invoked for a page route incorrectly.
      response = new Response("Not Found", { status: 404 });
    }

    if (!path.startsWith("/api/") || response.headers.get("X-Request-Id") === null) {
      response = withSecurityHeaders(response, requestId);
    }

    logRequest(requestId, request.method, path, response.status, Date.now() - start);
    return response;
  },
};
