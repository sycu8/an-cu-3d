const FLOORPLAN_KEYWORDS = [
  "floor plan",
  "floorplan",
  "mat bang",
  "mặt bằng",
  "layout",
  "unit plan",
  "apartment plan",
  "mb căn",
];

const ATLAS_KEYWORDS = [
  "atlas",
  "master plan",
  "masterplan",
  "site plan",
  "tong mat bang",
  "tổng mặt bằng",
  "mat bang tong the",
  "mặt bằng tổng thể",
  "quy hoạch",
  "ban do du an",
  "bản đồ dự án",
];

const PERSPECTIVE_KEYWORDS = [
  "phoi canh",
  "phối cảnh",
  "perspective",
  "render",
  "3d view",
  "exterior view",
];

const BROCHURE_KEYWORDS = [
  "brochure",
  "catalog",
  "catalogue",
  "sales kit",
  "ho so ban hang",
  "hồ sơ bán hàng",
];

export type ClassificationResult = {
  label: "floorplan" | "unknown";
  confidence: number;
  matchedKeywords: string[];
};

/** Extended labels for crawl enrichment (atlas / brochure / perspective). */
export type AssetClassLabel =
  | "floorplan"
  | "atlas"
  | "perspective"
  | "brochure"
  | "unknown";

export type AssetClassification = {
  label: AssetClassLabel;
  confidence: number;
  matchedKeywords: string[];
};

/** Kept for ConversionWorkflow — floorplan vs unknown only. */
export function classifyByFilenameOrAlt(
  filename?: string,
  altText?: string,
): ClassificationResult {
  const extended = classifyAsset(filename, altText);
  if (extended.label === "floorplan") {
    return {
      label: "floorplan",
      confidence: extended.confidence,
      matchedKeywords: extended.matchedKeywords,
    };
  }
  return {
    label: "unknown",
    confidence: extended.confidence,
    matchedKeywords: extended.matchedKeywords,
  };
}

export function classifyAsset(
  filename?: string,
  altText?: string,
): AssetClassification {
  const haystack = `${filename ?? ""} ${altText ?? ""}`.toLowerCase();

  const sets: Array<[Exclude<AssetClassLabel, "unknown">, string[]]> = [
    ["atlas", ATLAS_KEYWORDS],
    ["floorplan", FLOORPLAN_KEYWORDS],
    ["perspective", PERSPECTIVE_KEYWORDS],
    ["brochure", BROCHURE_KEYWORDS],
  ];

  let best: AssetClassification = {
    label: "unknown",
    confidence: 0.2,
    matchedKeywords: [],
  };

  for (const [label, keywords] of sets) {
    const matched = keywords.filter((kw) => haystack.includes(kw));
    if (matched.length === 0) continue;
    const confidence = Math.min(0.95, 0.55 + matched.length * 0.12);
    if (confidence > best.confidence) {
      best = { label, confidence, matchedKeywords: matched };
    }
  }

  return best;
}
