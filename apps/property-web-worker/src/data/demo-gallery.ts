/** Curated atmospheric gallery placeholders — not official project marketing renders. */

import type { ProjectMediaItem } from "@ancu/shared";

/**
 * Demo 2D / perspective imagery for seed projects.
 * Provenance is explicit: Unsplash architectural atmosphere only — never claim official renders or invent metrics.
 */
export function demoGalleryForSlug(slug: string): ProjectMediaItem[] {
  const hash = [...slug].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0);
  const floorplans = [
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1400&q=80",
  ];
  const perspectives = [
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
  ];

  const fpA = floorplans[hash % floorplans.length]!;
  const fpB = floorplans[(hash + 1) % floorplans.length]!;
  const pA = perspectives[hash % perspectives.length]!;
  const pB = perspectives[(hash + 2) % perspectives.length]!;
  const pC = perspectives[(hash + 3) % perspectives.length]!;

  return [
    {
      id: `${slug}-fp-1`,
      kind: "floorplan_2d",
      url: fpA,
      altText: "Mặt bằng 2D minh họa (không phải bản vẽ chính thức)",
      caption: "Mặt bằng 2D — hình minh họa",
      sortOrder: 0,
      sourceClass: "estimated",
      provenance: "Unsplash atmosphere placeholder — chờ bản vẽ xác minh",
    },
    {
      id: `${slug}-fp-2`,
      kind: "floorplan_2d",
      url: fpB,
      altText: "Mặt bằng 2D bổ sung (minh họa)",
      caption: "Mặt bằng chi tiết — hình minh họa",
      sortOrder: 1,
      sourceClass: "estimated",
      provenance: "Unsplash atmosphere placeholder — chờ bản vẽ xác minh",
    },
    {
      id: `${slug}-persp-1`,
      kind: "perspective",
      url: pA,
      altText: "Phối cảnh nội thất minh họa",
      caption: "Phối cảnh phòng khách — minh họa",
      sortOrder: 0,
      sourceClass: "estimated",
      provenance: "Unsplash atmosphere placeholder — không phải render chính thức của dự án",
    },
    {
      id: `${slug}-persp-2`,
      kind: "perspective",
      url: pB,
      altText: "Phối cảnh không gian mở minh họa",
      caption: "Phối cảnh không gian mở — minh họa",
      sortOrder: 1,
      sourceClass: "estimated",
      provenance: "Unsplash atmosphere placeholder — không phải render chính thức của dự án",
    },
    {
      id: `${slug}-persp-3`,
      kind: "perspective",
      url: pC,
      altText: "Phối cảnh phòng ngủ minh họa",
      caption: "Phối cảnh phòng ngủ — minh họa",
      sortOrder: 2,
      sourceClass: "estimated",
      provenance: "Unsplash atmosphere placeholder — không phải render chính thức của dự án",
    },
  ];
}
