/**
 * Official / public crawl seeds per project — CĐT pages + atlas hints.
 * Used by admin discover/crawl and engine allowlist fetches.
 */

export type ProjectCrawlSeed = {
  projectSlug: string;
  developerSlug: string;
  officialUrls: { label: string; url: string }[];
  /**
   * Secondary-market listing pages (Batdongsan / OneHousing).
   * Reference-only — never treated as official CĐT price sheets.
   */
  secondaryMarketUrls?: { label: string; url: string }[];
  /** Keywords that help classify atlas / masterplan assets. */
  atlasHints: string[];
};

export const PROJECT_CRAWL_SEEDS: ProjectCrawlSeed[] = [
  {
    projectSlug: "eaton-park",
    developerSlug: "gamuda-land",
    officialUrls: [
      { label: "Gamuda Land VN", url: "https://www.gamudaland.com.vn" },
    ],
    secondaryMarketUrls: [
      { label: "OneHousing — mua bán", url: "https://onehousing.vn/mua-ban" },
      { label: "Batdongsan — tìm căn hộ (thứ cấp)", url: "https://batdongsan.com.vn/ban-can-ho" },
    ],
    atlasHints: ["tong mat bang", "master plan", "site plan"],
  },
  {
    projectSlug: "elysian",
    developerSlug: "gamuda-land",
    officialUrls: [
      { label: "Gamuda Land VN", url: "https://www.gamudaland.com.vn" },
    ],
    secondaryMarketUrls: [
      { label: "OneHousing — mua bán", url: "https://onehousing.vn/mua-ban" },
      { label: "Batdongsan — tìm căn hộ (thứ cấp)", url: "https://batdongsan.com.vn/ban-can-ho" },
    ],
    atlasHints: ["tong mat bang", "master plan"],
  },
  {
    projectSlug: "celadon-city",
    developerSlug: "gamuda-land",
    officialUrls: [
      { label: "Celadon City", url: "https://celadoncityhcm.com/" },
      { label: "Gamuda Land VN", url: "https://www.gamudaland.com.vn" },
    ],
    secondaryMarketUrls: [
      { label: "OneHousing — mua bán", url: "https://onehousing.vn/mua-ban" },
      { label: "Batdongsan — tìm căn hộ (thứ cấp)", url: "https://batdongsan.com.vn/ban-can-ho" },
    ],
    atlasHints: ["celadon", "tong mat bang", "master plan"],
  },
  {
    projectSlug: "vinhomes-grand-park",
    developerSlug: "vinhomes",
    officialUrls: [
      { label: "Vinhomes", url: "https://vinhomes.vn" },
      { label: "Vinhomes Grand Park", url: "https://vinhomes.vn/vi/grand-park" },
    ],
    secondaryMarketUrls: [
      { label: "OneHousing — Vinhomes Grand Park", url: "https://onehousing.vn/vinhomes-grand-park" },
      { label: "Batdongsan — tìm căn hộ (thứ cấp)", url: "https://batdongsan.com.vn/ban-can-ho" },
    ],
    atlasHints: ["grand park", "tong mat bang", "master plan", "atlas"],
  },
  {
    projectSlug: "vinhomes-ocean-park",
    developerSlug: "vinhomes",
    officialUrls: [
      { label: "Vinhomes", url: "https://vinhomes.vn" },
      { label: "Vinhomes Ocean Park", url: "https://vinhomes.vn/vi/ocean-park" },
    ],
    secondaryMarketUrls: [
      { label: "OneHousing — mua bán", url: "https://onehousing.vn/mua-ban" },
      { label: "Batdongsan — tìm căn hộ (thứ cấp)", url: "https://batdongsan.com.vn/ban-can-ho" },
    ],
    atlasHints: ["ocean park", "tong mat bang", "master plan"],
  },
  {
    projectSlug: "vinhomes-smart-city",
    developerSlug: "vinhomes",
    officialUrls: [
      { label: "Vinhomes", url: "https://vinhomes.vn" },
      { label: "Vinhomes Smart City", url: "https://vinhomes.vn/vi/smart-city" },
    ],
    secondaryMarketUrls: [
      { label: "OneHousing — mua bán", url: "https://onehousing.vn/mua-ban" },
      { label: "Batdongsan — tìm căn hộ (thứ cấp)", url: "https://batdongsan.com.vn/ban-can-ho" },
    ],
    atlasHints: ["smart city", "tong mat bang", "master plan"],
  },
  {
    projectSlug: "ecopark",
    developerSlug: "ecopark",
    officialUrls: [{ label: "Ecopark", url: "https://ecopark.com.vn" }],
    secondaryMarketUrls: [
      { label: "OneHousing — dự án", url: "https://onehousing.vn/du-an" },
      { label: "Batdongsan — tìm căn hộ (thứ cấp)", url: "https://batdongsan.com.vn/ban-can-ho" },
    ],
    atlasHints: ["ecopark", "quy hoạch", "tong mat bang", "atlas"],
  },
  {
    projectSlug: "ecopark-aqua-bay",
    developerSlug: "ecopark",
    officialUrls: [{ label: "Ecopark", url: "https://ecopark.com.vn" }],
    secondaryMarketUrls: [
      { label: "OneHousing — mua bán", url: "https://onehousing.vn/mua-ban" },
      { label: "Batdongsan — tìm căn hộ (thứ cấp)", url: "https://batdongsan.com.vn/ban-can-ho" },
    ],
    atlasHints: ["aqua bay", "mat bang", "phoi canh"],
  },
  {
    projectSlug: "opal-boulevard",
    developerSlug: "dat-xanh-bluemarq",
    officialUrls: [
      { label: "Đất Xanh Group", url: "https://www.datxanh.com.vn" },
    ],
    secondaryMarketUrls: [
      { label: "OneHousing — mua bán", url: "https://onehousing.vn/mua-ban" },
      { label: "Batdongsan — tìm căn hộ (thứ cấp)", url: "https://batdongsan.com.vn/ban-can-ho" },
    ],
    atlasHints: ["opal boulevard", "tong mat bang"],
  },
  {
    projectSlug: "the-prive",
    developerSlug: "dat-xanh-bluemarq",
    officialUrls: [
      { label: "Đất Xanh Group", url: "https://www.datxanh.com.vn" },
      { label: "Bluemarq", url: "https://www.bluemarq.vn" },
    ],
    secondaryMarketUrls: [
      { label: "OneHousing — mua bán", url: "https://onehousing.vn/mua-ban" },
      { label: "Batdongsan — tìm căn hộ (thứ cấp)", url: "https://batdongsan.com.vn/ban-can-ho" },
    ],
    atlasHints: ["the prive", "tong mat bang", "master plan"],
  },
];

export function crawlSeedForSlug(slug: string): ProjectCrawlSeed | undefined {
  return PROJECT_CRAWL_SEEDS.find((s) => s.projectSlug === slug);
}
