import { getProjectBySlug, getProjectSummaries } from "../data/gamuda-projects";
import type { Env } from "./types";

function securityHeaders(requestId: string): Record<string, string> {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-Request-Id": requestId,
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://tile.openstreetmap.org https://*.tile.openstreetmap.org; connect-src 'self' https://tile.openstreetmap.org https://*.tile.openstreetmap.org; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'",
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

function json(data: unknown, requestId: string, status = 200): Response {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=60",
  });
  for (const [key, value] of Object.entries(securityHeaders(requestId))) {
    headers.set(key, value);
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function notFound(message: string, requestId: string): Response {
  return json({ error: message }, requestId, 404);
}

function methodNotAllowed(requestId: string): Response {
  return json({ error: "Method Not Allowed" }, requestId, 405);
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

async function handleApi(request: Request, env: Env, requestId: string): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/api/health") {
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
      timestamp: new Date().toISOString(),
    };
    if (env.APP_VERSION) {
      body.version = env.APP_VERSION;
    }
    return json(body, requestId);
  }

  if (path === "/api/projects") {
    const projects = getProjectSummaries();
    return json({ projects, source: "seed" }, requestId);
  }

  const projectMatch = path.match(/^\/api\/projects\/([^/]+)$/);
  if (projectMatch) {
    const slug = decodeURIComponent(projectMatch[1]);
    const project = getProjectBySlug(slug);
    if (!project) return notFound(`Project not found: ${slug}`, requestId);
    return json({ project, source: "seed" }, requestId);
  }

  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    const url = new URL(request.url);
    const path = url.pathname;

    let response: Response;

    if (path.startsWith("/api/") && request.method !== "GET") {
      response = methodNotAllowed(requestId);
    } else if (request.method !== "GET") {
      response = new Response("Method Not Allowed", { status: 405 });
    } else {
      const apiResponse = await handleApi(request, env, requestId);
      if (apiResponse) {
        response = apiResponse;
      } else {
        response = new Response("Not Found", { status: 404 });
      }
    }

    if (!path.startsWith("/api/") || response.headers.get("X-Request-Id") === null) {
      response = withSecurityHeaders(response, requestId);
    }

    logRequest(requestId, request.method, path, response.status, Date.now() - start);
    return response;
  },
};
