/** R2 key conventions for AnCư 3D (P5). All paths are POSIX-style, no leading slash. */

export const R2_ROOT = {
  projects: "projects",
  floorplans: "floorplans",
  shared: "shared",
} as const;

export const FLOORPLAN_STAGES = [
  "sources",
  "raw",
  "normalized",
  "analysis",
  "geometry",
  "previews",
  "published",
  "rejected",
] as const;

export type FloorplanStage = (typeof FLOORPLAN_STAGES)[number];

export const SHARED_ASSET_KINDS = ["furniture", "textures", "materials"] as const;

export type SharedAssetKind = (typeof SHARED_ASSET_KINDS)[number];

/** `projects/{projectSlug}/` */
export function projectPrefix(projectSlug: string): string {
  return `${R2_ROOT.projects}/${sanitizeSegment(projectSlug)}/`;
}

/** `projects/{projectSlug}/{...rest}` */
export function projectPath(projectSlug: string, ...rest: string[]): string {
  return joinSegments(projectPrefix(projectSlug), ...rest);
}

/** `floorplans/{stage}/` */
export function floorplanStagePrefix(stage: FloorplanStage): string {
  return `${R2_ROOT.floorplans}/${stage}/`;
}

/** `floorplans/{stage}/{projectSlug}/{jobId}/{filename}` */
export function floorplanArtifactPath(
  stage: FloorplanStage,
  projectSlug: string,
  jobId: string,
  filename: string,
): string {
  return joinSegments(
    floorplanStagePrefix(stage),
    sanitizeSegment(projectSlug),
    sanitizeSegment(jobId),
    filename,
  );
}

/** Published FloorPlanDocument JSON key. */
export function publishedFloorPlanDocumentKey(
  projectSlug: string,
  documentId: string,
  version = "latest",
): string {
  return floorplanArtifactPath(
    "published",
    projectSlug,
    documentId,
    `floorplan-${version}.json`,
  );
}

/** `shared/{kind}/{assetId}/{filename}` */
export function sharedAssetPath(
  kind: SharedAssetKind,
  assetId: string,
  filename: string,
): string {
  return joinSegments(R2_ROOT.shared, kind, sanitizeSegment(assetId), filename);
}

function joinSegments(...parts: string[]): string {
  return parts
    .flatMap((part) => part.split("/"))
    .filter(Boolean)
    .join("/");
}

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}
