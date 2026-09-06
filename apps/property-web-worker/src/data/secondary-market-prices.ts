/**
 * Secondary-market price references for seed projects.
 * These are NOT official CĐT list prices.
 * Always surface with explicit provenance in UI.
 */

export type SecondaryMarketPriceRef = {
  projectSlug: string;
  /** Display string for project.priceRange (must declare non-CĐT). */
  priceRangeLabel: string;
  /** Human-readable provenance shown under the price. */
  provenance: string;
  /** Research / listing domains consulted (allowlisted secondary sites). */
  sourceDomains: string[];
  /** ISO date of the research note (not a live scrape timestamp). */
  asOf: string;
  confidence: number;
};

const PREFIX = "Tham chiếu TT thứ cấp (không phải bảng giá CĐT)";

/**
 * Curated secondary-market ranges from public trade roundups.
 * Official CĐT unit prices remain "Chờ xác minh".
 */
export const SECONDARY_MARKET_PRICE_REFS: SecondaryMarketPriceRef[] = [
  {
    projectSlug: "vinhomes-grand-park",
    priceRangeLabel: `${PREFIX}: phổ biến khoảng 45–75 tr/m² tùy phân khu — cần xác minh từng căn`,
    provenance:
      "Tổng hợp giao dịch thứ cấp công bố trên Batdongsan / báo cáo môi giới Q4/2025–Q1/2026 (không phải bảng giá Vinhomes)",
    sourceDomains: ["batdongsan.com.vn", "onehousing.vn", "cafeland.vn"],
    asOf: "2026-03-01",
    confidence: 0.55,
  },
  {
    projectSlug: "vinhomes-ocean-park",
    priceRangeLabel: `${PREFIX}: phổ biến khoảng 35–55 tr/m² tùy phân khu — cần xác minh từng căn`,
    provenance:
      "Tham chiếu giao dịch thứ cấp Ocean Park trên Batdongsan / CafeLand (không phải bảng giá CĐT)",
    sourceDomains: ["batdongsan.com.vn", "onehousing.vn", "cafeland.vn"],
    asOf: "2026-03-01",
    confidence: 0.52,
  },
  {
    projectSlug: "vinhomes-smart-city",
    priceRangeLabel: `${PREFIX}: phổ biến khoảng 90–140 tr/m² tùy phân khu — cần xác minh trước giao dịch`,
    provenance:
      "Vinhomes Smart City public identity; secondary ranges from trade roundups Q1/2026 (not CĐT price list)",
    sourceDomains: ["batdongsan.com.vn", "onehousing.vn", "mogi.vn"],
    asOf: "2026-03-01",
    confidence: 0.55,
  },
  {
    projectSlug: "ecopark-aqua-bay",
    priceRangeLabel: `${PREFIX}: phổ biến khoảng 55–65 tr/m² — cần xác minh từng căn`,
    provenance:
      "Ecopark Aqua Bay secondary market roundups (handed-over towers); not CĐT list price",
    sourceDomains: ["batdongsan.com.vn", "onehousing.vn", "homedy.com"],
    asOf: "2026-02-15",
    confidence: 0.58,
  },
  {
    projectSlug: "ecopark",
    priceRangeLabel: `${PREFIX}: thấp tầng / shophouse biến động mạnh theo vị trí — cần xác minh từng căn`,
    provenance:
      "Ecopark township secondary listings (low-rise / shophouse); ranges vary widely by street — not CĐT sheet",
    sourceDomains: ["batdongsan.com.vn", "onehousing.vn", "cafeland.vn"],
    asOf: "2026-02-15",
    confidence: 0.45,
  },
  {
    projectSlug: "opal-boulevard",
    priceRangeLabel: `${PREFIX}: phổ biến khoảng 40–55 tr/m² (đã bàn giao) — cần xác minh từng căn`,
    provenance:
      "Opal Boulevard secondary trade notes on Batdongsan / Homedy (not Đất Xanh official list)",
    sourceDomains: ["batdongsan.com.vn", "onehousing.vn", "homedy.com"],
    asOf: "2026-02-01",
    confidence: 0.5,
  },
];

export function secondaryPriceForSlug(
  slug: string,
): SecondaryMarketPriceRef | undefined {
  return SECONDARY_MARKET_PRICE_REFS.find((r) => r.projectSlug === slug);
}

/** Apply curated secondary-market labels onto seed projects (does not invent CĐT prices). */
export function applySecondaryMarketPrice<
  T extends { slug: string; priceRange: string; priceProvenance?: string },
>(project: T): T {
  const ref = secondaryPriceForSlug(project.slug);
  if (!ref) return project;
  return {
    ...project,
    priceRange: ref.priceRangeLabel,
    priceProvenance: ref.provenance,
  };
}
