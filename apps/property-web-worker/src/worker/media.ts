import {
  mediaUrl,
  MEDIA_VARIANTS,
  isSafeR2Key,
  normalizeR2Key,
  type MediaVariant,
} from "@ancu/shared";
import type { Env } from "./types";

const CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

type Fit = "scale-down" | "contain" | "cover" | "crop" | "pad";

type TransformSpec = {
  width?: number;
  height?: number;
  fit?: Fit;
  format?: "image/webp" | "image/avif" | "image/jpeg" | "image/png";
  quality?: number;
};

const FORMAT_MAP = {
  webp: "image/webp",
  avif: "image/avif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
} as const;

function parseTransform(url: URL): TransformSpec | null {
  const variant = url.searchParams.get("v") as MediaVariant | null;
  const widthRaw = url.searchParams.get("w");
  const heightRaw = url.searchParams.get("h");
  const fitRaw = url.searchParams.get("fit");
  const formatRaw = url.searchParams.get("f");
  const qualityRaw = url.searchParams.get("q");

  const spec: TransformSpec = {};

  if (widthRaw) {
    const w = Number(widthRaw);
    if (Number.isFinite(w) && w > 0 && w <= 4096) spec.width = Math.round(w);
  } else if (variant && variant in MEDIA_VARIANTS) {
    const preset = MEDIA_VARIANTS[variant];
    spec.width = preset.width;
    spec.fit = preset.fit;
  }

  if (heightRaw) {
    const h = Number(heightRaw);
    if (Number.isFinite(h) && h > 0 && h <= 4096) spec.height = Math.round(h);
  }

  if (fitRaw && ["scale-down", "contain", "cover", "crop", "pad"].includes(fitRaw)) {
    spec.fit = fitRaw as Fit;
  }

  if (formatRaw && formatRaw in FORMAT_MAP) {
    spec.format = FORMAT_MAP[formatRaw as keyof typeof FORMAT_MAP];
  }

  if (qualityRaw) {
    const q = Number(qualityRaw);
    if (Number.isFinite(q) && q >= 1 && q <= 100) spec.quality = Math.round(q);
  }

  if (!spec.width && !spec.height && !spec.format) return null;
  return spec;
}

function isImageContentType(contentType: string | undefined): boolean {
  return Boolean(contentType?.startsWith("image/"));
}

/**
 * Serve an object from R2 (`ASSETS`), optionally resized via Cloudflare Images.
 * Route: GET/HEAD /api/media/<r2-key>?v=card|w=&h=&fit=&f=&q=
 */

function getDefaultCache(): Cache | null {
  try {
    const store = (globalThis as unknown as { caches?: { default?: Cache } }).caches;
    return store?.default ?? null;
  } catch {
    return null;
  }
}

export async function serveMedia(
  request: Request,
  env: Env,
  requestId: string,
): Promise<Response> {
  const url = new URL(request.url);
  const prefix = "/api/media/";
  if (!url.pathname.startsWith(prefix)) {
    return jsonError(404, "not_found", requestId);
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return jsonError(405, "method_not_allowed", requestId);
  }

  const rawKey = decodeURIComponent(url.pathname.slice(prefix.length));
  if (rawKey.includes("..") || rawKey.includes("\\") || rawKey.includes("\0")) {
    return jsonError(400, "invalid_key", requestId);
  }
  const key = normalizeR2Key(rawKey);
  if (!key || !isSafeR2Key(key)) {
    return jsonError(400, "invalid_key", requestId);
  }

  if (!env.ASSETS) {
    return jsonError(503, "r2_unavailable", requestId);
  }

  const transform = parseTransform(url);
  const cache = getDefaultCache();
  const cacheKey = new Request(url.toString(), { method: "GET" });

  if (request.method === "GET" && cache) {
    const cached = await cache.match(cacheKey);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set("X-Request-Id", requestId);
      headers.set("X-Media-Cache", "HIT");
      return new Response(cached.body, { status: cached.status, headers });
    }
  }

  const object = await env.ASSETS.get(key);
  if (!object) {
    return jsonError(404, "object_not_found", requestId);
  }

  const sourceType = object.httpMetadata?.contentType ?? guessContentType(key);

  if (request.method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": sourceType,
        "Cache-Control": CACHE_CONTROL,
        ETag: object.httpEtag,
        "X-Request-Id": requestId,
        "X-R2-Key": key,
      },
    });
  }

  const shouldTransform =
    Boolean(transform) && isImageContentType(sourceType) && Boolean(env.IMAGES) && Boolean(object.body);

  if (shouldTransform && transform && env.IMAGES && object.body) {
    try {
      const transformed = await env.IMAGES.input(object.body)
        .transform({
          width: transform.width,
          height: transform.height,
          fit: transform.fit ?? "scale-down",
        })
        .output({
          format: transform.format ?? "image/webp",
          quality: transform.quality ?? 85,
        });

      const response = transformed.response({
        headers: {
          "Cache-Control": CACHE_CONTROL,
          ETag: object.httpEtag,
          "X-Request-Id": requestId,
          "X-R2-Key": key,
          "X-Images": "transformed",
          "X-Media-Cache": "MISS",
        },
      });
      if (cache) void cache.put(cacheKey, response.clone());
      return response;
    } catch (err) {
      console.warn(
        JSON.stringify({
          level: "warn",
          requestId,
          msg: "images_transform_failed",
          key,
          error: err instanceof Error ? err.message : String(err),
        }),
      );
      const raw = await env.ASSETS.get(key);
      if (!raw) return jsonError(404, "object_not_found", requestId);
      return rawObjectResponse(raw, key, sourceType, requestId, cache, cacheKey, "images_fallback");
    }
  }

  return rawObjectResponse(object, key, sourceType, requestId, cache, cacheKey, "raw");
}

function jsonError(status: number, error: string, requestId: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json", "X-Request-Id": requestId },
  });
}

async function rawObjectResponse(
  object: R2ObjectBody,
  key: string,
  contentType: string,
  requestId: string,
  cache: Cache | null,
  cacheKey: Request,
  mode: string,
): Promise<Response> {
  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": CACHE_CONTROL,
    ETag: object.httpEtag,
    "X-Request-Id": requestId,
    "X-R2-Key": key,
    "X-Images": mode,
    "X-Media-Cache": "MISS",
  });
  if (object.size != null) headers.set("Content-Length", String(object.size));

  const response = new Response(object.body, { status: 200, headers });
  if (cache) void cache.put(cacheKey, response.clone());
  return response;
}

function guessContentType(key: string): string {
  const lower = key.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

/** Attach a public media URL beside an R2 key for API responses. */
export function withMediaUrl<T extends { r2Key?: string }>(
  result: T,
  options?: { variant?: MediaVariant },
): T & { url?: string } {
  if (!result.r2Key) return { ...result };
  return {
    ...result,
    url: mediaUrl(result.r2Key, {
      variant: options?.variant ?? "card",
      format: "webp",
    }),
  };
}
