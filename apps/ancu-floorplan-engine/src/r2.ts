export type R2Stage =
  | "raw"
  | "normalized"
  | "analysis"
  | "geometry"
  | "previews"
  | "published";

export function r2Key(
  stage: R2Stage,
  projectSlug: string,
  ...parts: string[]
): string {
  const safeProject = sanitizeSegment(projectSlug);
  const safeParts = parts.map(sanitizeSegment).filter(Boolean);
  return [stage, safeProject, ...safeParts].join("/");
}

export function publishedFloorplanKey(
  projectSlug: string,
  versionId: string,
): string {
  return r2Key("published", projectSlug, `${versionId}.json`);
}

export function rawAssetKey(
  projectSlug: string,
  assetId: string,
  ext = "bin",
): string {
  return r2Key("raw", projectSlug, `${assetId}.${ext}`);
}

export function normalizedAssetKey(
  projectSlug: string,
  assetId: string,
): string {
  return r2Key("normalized", projectSlug, `${assetId}.json`);
}

export function analysisArtifactKey(
  projectSlug: string,
  jobId: string,
): string {
  return r2Key("analysis", projectSlug, `${jobId}.json`);
}

export function geometryArtifactKey(
  projectSlug: string,
  jobId: string,
): string {
  return r2Key("geometry", projectSlug, `${jobId}.json`);
}

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
