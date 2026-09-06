/** Cover imagery helpers — prefer R2 / seeded coverUrl, fall back to unique architectural placeholders. */

import { resolveCoverUrl } from "@ancu/shared";
import { mediaSeedForSlug } from "../data/project-media-seeds";

/** Distinct working Unsplash covers (no 404s, no shared duplicates across inventory). */
const FALLBACK_COVERS = [
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80",
] as const;

export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=2000&q=80";

export function placeholderCoverUrl(slug: string): string {
  const seeded = mediaSeedForSlug(slug)?.coverUrl;
  if (seeded) return seeded;
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_COVERS[hash % FALLBACK_COVERS.length]!;
}

/** Resolve project cover: explicit/R2 URL when available, else seeded/stable placeholder. */
export function projectCoverUrl(
  slug: string,
  cover?: { coverUrl?: string | null; coverR2Key?: string | null },
): string {
  return resolveCoverUrl(
    cover?.coverUrl,
    cover?.coverR2Key,
    placeholderCoverUrl(slug),
    { variant: "card", format: "webp" },
  );
}

/** Last-resort local SVG when a remote cover fails to load. */
export const COVER_ERROR_FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#d9e2d0"/><stop offset="100%" stop-color="#b7c4b0"/>
      </linearGradient></defs>
      <rect width="1200" height="800" fill="url(#g)"/>
      <text x="600" y="400" text-anchor="middle" fill="#3f4a3a" font-family="Georgia, serif" font-size="36">AnCư 3D</text>
    </svg>`,
  );
