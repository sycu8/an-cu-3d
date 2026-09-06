/** R2 key conventions for AnCư 3D (P5). POSIX paths, no leading slash. */

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

export function projectPrefix(projectSlug: string): string {
  return `${R2_ROOT.projects}/${sanitize(projectSlug)}/`;
}

export function projectPath(projectSlug: string, ...rest: string[]): string {
  return join(projectPrefix(projectSlug), ...rest);
}

export function floorplanStagePrefix(stage: FloorplanStage): string {
  return `${R2_ROOT.floorplans}/${stage}/`;
}

export function floorplanArtifactPath(
  stage: FloorplanStage,
  projectSlug: string,
  jobId: string,
  filename: string,
): string {
  return join(floorplanStagePrefix(stage), sanitize(projectSlug), sanitize(jobId), filename);
}

export function publishedFloorPlanDocumentKey(
  projectSlug: string,
  documentId: string,
  version = "latest",
): string {
  return floorplanArtifactPath("published", projectSlug, documentId, `floorplan-${version}.json`);
}

export function sharedAssetPath(kind: SharedAssetKind, assetId: string, filename: string): string {
  return join(R2_ROOT.shared, kind, sanitize(assetId), filename);
}

function join(...parts: string[]): string {
  return parts.flatMap((p) => p.split("/")).filter(Boolean).join("/");
}

function sanitize(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}
