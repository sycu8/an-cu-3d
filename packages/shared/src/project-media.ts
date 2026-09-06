/** Project gallery media kinds for 2D floorplans, perspectives, and atlases. */

export const PROJECT_MEDIA_KINDS = [
  "floorplan_2d",
  "perspective",
  "elevation",
  "site",
  /** Masterplan / tổng mặt bằng / atlas quy hoạch */
  "atlas",
] as const;

export type ProjectMediaKind = (typeof PROJECT_MEDIA_KINDS)[number];

export type ProjectMediaItem = {
  id: string;
  kind: ProjectMediaKind;
  /** Public absolute/relative URL when not using R2. */
  url?: string | null;
  /** R2 object key served via /api/media. */
  r2Key?: string | null;
  altText?: string | null;
  caption?: string | null;
  sortOrder?: number;
  /** Optional apartment type slug for unit-scoped media. */
  unitSlug?: string | null;
  sourceClass?: string;
  provenance?: string | null;
};

/** Visitor-facing unit/showroom view modes. */
export const UNIT_VIEW_MODES = ["2d", "perspective", "3d", "auto"] as const;
export type UnitViewMode = (typeof UNIT_VIEW_MODES)[number];

export const UNIT_VIEW_MODE_LABELS: Record<UnitViewMode, string> = {
  "2d": "Mặt bằng WebGL",
  perspective: "Phối cảnh 3D",
  "3d": "Xem 3D",
  auto: "Tự phối cảnh",
};

export function isUnitViewMode(value: string | null | undefined): value is UnitViewMode {
  return Boolean(value && (UNIT_VIEW_MODES as readonly string[]).includes(value));
}

export function filterProjectMedia(
  items: ProjectMediaItem[] | undefined,
  kind: ProjectMediaKind,
  unitSlug?: string | null,
): ProjectMediaItem[] {
  if (!items?.length) return [];
  return items
    .filter((item) => item.kind === kind)
    .filter((item) => {
      if (!unitSlug) return true;
      if (!item.unitSlug) return true;
      return item.unitSlug === unitSlug;
    })
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}
