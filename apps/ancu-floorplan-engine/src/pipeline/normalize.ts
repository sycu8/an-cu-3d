export type NormalizedAsset = {
  assetId: string;
  projectSlug: string;
  mimeType?: string;
  byteSize?: number;
  metadata: Record<string, string | number | boolean | null>;
};

export function normalizeAsset(input: {
  assetId: string;
  projectSlug: string;
  mimeType?: string;
  byteSize?: number;
  metadata?: Record<string, string | number | boolean | null>;
}): NormalizedAsset {
  return {
    assetId: input.assetId,
    projectSlug: input.projectSlug,
    mimeType: input.mimeType,
    byteSize: input.byteSize,
    metadata: {
      ...input.metadata,
      normalizedAt: new Date().toISOString(),
      passthrough: true,
    },
  };
}
