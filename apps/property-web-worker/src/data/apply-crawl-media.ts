import type { ProjectDetail, ProjectMediaItem } from "../types";
import { crawlSeedForSlug } from "./project-crawl-seeds";

/**
 * Attach atlas / masterplan placeholder media from crawl seeds.
 * No fabricated image URLs — gallery stays empty until allowlisted crawl fills assets.
 */
export function applyCrawlMediaHints(project: ProjectDetail): ProjectDetail {
  const seed = crawlSeedForSlug(project.slug);
  if (!seed) return project;

  const existing = project.media ?? [];
  if (existing.some((m) => m.kind === "atlas")) return project;

  const atlas: ProjectMediaItem = {
    id: `media_atlas_${project.slug}`,
    kind: "atlas",
    altText: `Atlas / tổng mặt bằng — ${project.name}`,
    caption: "Atlas quy hoạch / tổng mặt bằng — chờ crawl từ trang CĐT allowlist",
    provenance: `Seed hints: ${seed.atlasHints.slice(0, 3).join(", ")}; nguồn: ${seed.officialUrls
      .map((u) => u.label)
      .join(", ")}`,
    sortOrder: 0,
    sourceClass: "estimated",
  };

  return { ...project, media: [atlas, ...existing] };
}
