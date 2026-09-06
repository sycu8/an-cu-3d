import type { ProjectDetail, ProjectMediaItem } from "../types";
import { crawlSeedForSlug } from "./project-crawl-seeds";
import { mediaSeedForSlug } from "./project-media-seeds";

/**
 * Attach curated cover/gallery media when available, plus atlas placeholders from crawl seeds.
 * Prefer official / seeded URLs over empty galleries so cards and detail pages render real imagery.
 */
export function applyCrawlMediaHints(project: ProjectDetail): ProjectDetail {
  const mediaSeed = mediaSeedForSlug(project.slug);
  const crawlSeed = crawlSeedForSlug(project.slug);

  let media: ProjectMediaItem[] = [...(project.media ?? [])];
  let coverUrl = project.coverUrl;

  if (mediaSeed) {
    coverUrl = coverUrl ?? mediaSeed.coverUrl;
    const existingIds = new Set(media.map((m) => m.id));
    for (const item of mediaSeed.items) {
      if (!existingIds.has(item.id)) media.push(item);
    }
  }

  const hasAtlasAsset = media.some(
    (m) => m.kind === "atlas" && Boolean(m.url?.trim() || m.r2Key?.trim()),
  );

  if (crawlSeed && !hasAtlasAsset && !media.some((m) => m.kind === "atlas")) {
    media = [
      {
        id: `media_atlas_${project.slug}`,
        kind: "atlas",
        altText: `Atlas / tổng mặt bằng — ${project.name}`,
        caption: "Atlas quy hoạch / tổng mặt bằng — chờ crawl từ trang CĐT allowlist",
        provenance: `Seed hints: ${crawlSeed.atlasHints.slice(0, 3).join(", ")}; nguồn: ${crawlSeed.officialUrls
          .map((u) => u.label)
          .join(", ")}`,
        sortOrder: 100,
        sourceClass: "estimated",
      },
      ...media,
    ];
  }

  media = [...media].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return {
    ...project,
    coverUrl,
    media,
  };
}
