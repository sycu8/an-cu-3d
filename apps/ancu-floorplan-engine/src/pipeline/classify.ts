const FLOORPLAN_KEYWORDS = [
  "floor plan",
  "floorplan",
  "mat bang",
  "mặt bằng",
  "layout",
  "unit plan",
  "apartment plan",
];

export type ClassificationResult = {
  label: "floorplan" | "unknown";
  confidence: number;
  matchedKeywords: string[];
};

export function classifyByFilenameOrAlt(
  filename?: string,
  altText?: string,
): ClassificationResult {
  const haystack = `${filename ?? ""} ${altText ?? ""}`.toLowerCase();
  const matched = FLOORPLAN_KEYWORDS.filter((kw) => haystack.includes(kw));

  if (matched.length > 0) {
    return {
      label: "floorplan",
      confidence: Math.min(0.95, 0.6 + matched.length * 0.1),
      matchedKeywords: matched,
    };
  }

  return {
    label: "unknown",
    confidence: 0.2,
    matchedKeywords: [],
  };
}
