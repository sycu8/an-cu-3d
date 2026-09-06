import { getProjectBySlug, getProjectSummaries } from "../data/gamuda-projects";
import type { Env } from "./types";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
}

function notFound(message: string): Response {
  return json({ error: message }, 404);
}

async function handleApi(request: Request, env: Env): Promise<Response | null> {
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
    return json({
      status: "ok",
      service: "ancu-property-web",
      db: dbStatus,
      timestamp: new Date().toISOString(),
    });
  }

  if (path === "/api/projects") {
    const projects = getProjectSummaries();
    return json({ projects, source: "seed" });
  }

  const projectMatch = path.match(/^\/api\/projects\/([^/]+)$/);
  if (projectMatch) {
    const slug = decodeURIComponent(projectMatch[1]);
    const project = getProjectBySlug(slug);
    if (!project) return notFound(`Project not found: ${slug}`);
    return json({ project, source: "seed" });
  }

  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const apiResponse = await handleApi(request, env);
    if (apiResponse) return apiResponse;

    // SPA assets are served by Workers Assets binding (not_found_handling: spa)
    return new Response("Not Found", { status: 404 });
  },
};
