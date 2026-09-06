/** Public media URL helpers for R2-backed objects (served via property-web Worker). */

export const MEDIA_API_PREFIX = "/api/media" as const;

/** Named resize presets consumed by the Worker Images binding. */
export const MEDIA_VARIANTS = {
  thumb: { width: 320, fit: "cover" as const },
  card: { width: 640, fit: "cover" as const },
  blog: { width: 1200, fit: "cover" as const },
  hero: { width: 1920, fit: "cover" as const },
} as const;

export type MediaVariant = keyof typeof MEDIA_VARIANTS;

export type MediaUrlOptions = {
  /** Named preset; ignored when width is set. */
  variant?: MediaVariant;
  width?: number;
  height?: number;
  fit?: "scale-down" | "contain" | "cover" | "crop" | "pad" | "squeeze";
  /** Output format hint for Images transform. */
  format?: "webp" | "avif" | "jpeg" | "png";
  quality?: number;
};

/** Build a same-origin media URL for an R2 object key. */
export function mediaUrl(r2Key: string, options: MediaUrlOptions = {}): string {
  const key = normalizeR2Key(r2Key);
  if (!key) return MEDIA_API_PREFIX;

  const params = new URLSearchParams();
  if (options.width && options.width > 0) {
    params.set("w", String(Math.round(options.width)));
  } else if (options.variant && options.variant in MEDIA_VARIANTS) {
    params.set("v", options.variant);
  }
  if (options.height && options.height > 0) {
    params.set("h", String(Math.round(options.height)));
  }
  if (options.fit) params.set("fit", options.fit);
  if (options.format) params.set("f", options.format);
  if (options.quality && options.quality > 0) {
    params.set("q", String(Math.round(options.quality)));
  }

  const qs = params.toString();
  return qs ? `${MEDIA_API_PREFIX}/${key}?${qs}` : `${MEDIA_API_PREFIX}/${key}`;
}

/** Prefer explicit cover URL, then R2 key via media API, else fallback. */
export function resolveCoverUrl(
  coverUrl: string | null | undefined,
  coverR2Key: string | null | undefined,
  fallback: string,
  options: MediaUrlOptions = { variant: "card" },
): string {
  if (coverUrl?.trim()) return coverUrl.trim();
  if (coverR2Key?.trim()) return mediaUrl(coverR2Key.trim(), options);
  return fallback;
}

export function normalizeR2Key(raw: string): string {
  return raw
    .replace(/^\/+/, "")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

export function isSafeR2Key(key: string): boolean {
  if (!key || key.length > 512) return false;
  if (key.includes("\\") || key.includes("\0")) return false;
  if (key.startsWith("/") || key.includes("://")) return false;
  const parts = key.split("/");
  return parts.every((p) => p.length > 0 && p !== "." && p !== "..");
}
