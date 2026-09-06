/** Cover imagery helpers — prefer R2 / seeded CĐT coverUrl; never AI or stock Unsplash. */

import { resolveCoverUrl } from "@ancu/shared";
import { mediaSeedForSlug } from "../data/project-media-seeds";

/** Home hero — official Celadon City CĐT asset (not stock / AI). */
export const HERO_IMAGE =
  "https://celadoncityhcm.com/wp-content/uploads/2020/12/98000254_101754371555953_4289346695638024192_o.jpg";

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

export function placeholderCoverUrl(slug: string): string {
  const seeded = mediaSeedForSlug(slug)?.coverUrl;
  if (seeded) return seeded;
  return COVER_ERROR_FALLBACK;
}

/** Resolve project cover: explicit/R2 URL when available, else seeded CĐT cover / SVG. */
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
