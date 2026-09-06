/**
 * URL-driven project catalog filters (Radan-inspired advanced search),
 * adapted to AnCư's project decision inventory — not a listing dump.
 */
import type { ProjectSummary } from "../types";

export type PriceBand = "" | "under-2" | "2-4" | "4-7" | "7-plus";

export interface ProjectFilters {
  q: string;
  district: string;
  priceBand: PriceBand;
  bedrooms: number | null;
  /** Amenity category id for map deep-link (not applied to catalog list). */
  amenity: string;
}

export const PRICE_BAND_OPTIONS: { value: PriceBand; label: string }[] = [
  { value: "", label: "Mọi mức giá" },
  { value: "under-2", label: "Dưới 2 tỷ" },
  { value: "2-4", label: "2 – 4 tỷ" },
  { value: "4-7", label: "4 – 7 tỷ" },
  { value: "7-plus", label: "Trên 7 tỷ" },
];

export const BEDROOM_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: "Mọi số PN" },
  { value: 1, label: "1 PN+" },
  { value: 2, label: "2 PN+" },
  { value: 3, label: "3 PN+" },
  { value: 4, label: "4 PN+" },
];

export const AMENITY_QUICK_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Tiện ích (bản đồ)" },
  { value: "education", label: "Trường học" },
  { value: "hospital", label: "Bệnh viện" },
  { value: "shopping", label: "Siêu thị / TTTM" },
  { value: "park", label: "Công viên" },
  { value: "transport", label: "Giao thông" },
];

const EMPTY: ProjectFilters = {
  q: "",
  district: "",
  priceBand: "",
  bedrooms: null,
  amenity: "",
};

export function emptyProjectFilters(): ProjectFilters {
  return { ...EMPTY };
}

export function parseProjectFilters(
  params: URLSearchParams | Record<string, string | undefined>,
): ProjectFilters {
  const get = (key: string): string => {
    if (params instanceof URLSearchParams) return params.get(key) ?? "";
    return params[key] ?? "";
  };

  const rawBed = get("bedrooms") || get("pn");
  const bedrooms = rawBed ? Number(rawBed) : NaN;
  const priceBandRaw = get("price") || get("priceBand");
  const priceBand = PRICE_BAND_OPTIONS.some((o) => o.value === priceBandRaw)
    ? (priceBandRaw as PriceBand)
    : "";

  return {
    q: get("q").trim(),
    district: get("district").trim(),
    priceBand,
    bedrooms: Number.isFinite(bedrooms) && bedrooms > 0 ? bedrooms : null,
    amenity: get("amenity").trim() || get("categories").split(",")[0]?.trim() || "",
  };
}

export function projectFiltersToSearchParams(filters: ProjectFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.district) params.set("district", filters.district);
  if (filters.priceBand) params.set("price", filters.priceBand);
  if (filters.bedrooms != null) params.set("bedrooms", String(filters.bedrooms));
  if (filters.amenity) params.set("amenity", filters.amenity);
  return params;
}

export function projectFiltersToQuery(filters: ProjectFilters): string {
  const params = projectFiltersToSearchParams(filters);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export function hasActiveProjectFilters(filters: ProjectFilters): boolean {
  return Boolean(
    filters.q ||
      filters.district ||
      filters.priceBand ||
      filters.bedrooms != null ||
      filters.amenity,
  );
}

/** Normalize district labels into comparable area keys (Radan-style khu vực chips). */
export function normalizeDistrictKey(district: string | undefined | null): string {
  if (!district) return "";
  const d = district.toLowerCase();
  if (d.includes("thủ đức") || d.includes("thu duc")) return "TP. Thủ Đức";
  if (d.includes("tân phú") || d.includes("tan phu")) return "Tân Phú";
  if (d.includes("văn giang") || d.includes("van giang") || d.includes("gia lâm"))
    return "Văn Giang / Gia Lâm";
  if (d.includes("nam từ liêm") || d.includes("nam tu liem")) return "Nam Từ Liêm";
  if (d.includes("dĩ an") || d.includes("di an") || d.includes("bình dương"))
    return "Dĩ An / Bình Dương";
  return district.split("—")[0]?.split("/")[0]?.trim() || district;
}

export function listDistrictOptions(projects: ProjectSummary[]): string[] {
  const counts = new Map<string, number>();
  for (const p of projects) {
    const key = normalizeDistrictKey(p.district ?? p.city);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "vi"))
    .map(([k]) => k);
}

export function districtProjectCounts(
  projects: ProjectSummary[],
): { district: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of projects) {
    const key = normalizeDistrictKey(p.district ?? p.city);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count || a.district.localeCompare(b.district, "vi"));
}

/**
 * Extract a lower-bound price in tỷ VND from free-text priceRange when possible.
 * Returns null when unverified / pending / unparseable (trust-first: do not invent).
 */
export function parsePriceTyLowerBound(priceRange: string | undefined | null): number | null {
  if (!priceRange) return null;
  const text = priceRange.trim();
  if (!text || /chờ xác minh|đang cập nhật|pending|n\/a/i.test(text)) return null;

  const tyMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:[-–]\s*(\d+(?:[.,]\d+)?))?\s*tỷ/i);
  if (tyMatch) {
    const a = Number(tyMatch[1].replace(",", "."));
    return Number.isFinite(a) ? a : null;
  }

  const trieuMatch = text.match(/(\d+(?:[.,]\d+)?)\s*tr(?:iệu)?\s*\/?\s*m/i);
  if (trieuMatch) {
    // Unit price only — cannot filter as absolute project price
    return null;
  }

  return null;
}

function matchesPriceBand(priceTy: number | null, band: PriceBand): boolean {
  if (!band) return true;
  if (priceTy == null) return false;
  switch (band) {
    case "under-2":
      return priceTy < 2;
    case "2-4":
      return priceTy >= 2 && priceTy < 4;
    case "4-7":
      return priceTy >= 4 && priceTy < 7;
    case "7-plus":
      return priceTy >= 7;
    default:
      return true;
  }
}

export type FilterableProject = ProjectSummary & {
  /** Max bedrooms available across published unit types when known. */
  maxBedrooms?: number;
  /** Min bedrooms when known. */
  minBedrooms?: number;
};

export function filterProjects(
  projects: FilterableProject[],
  filters: ProjectFilters,
): FilterableProject[] {
  const q = filters.q.trim().toLowerCase();
  const districtKey = filters.district.trim();

  return projects.filter((p) => {
    if (q) {
      const hay = [p.name, p.developerName, p.district, p.city, p.tagline]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (districtKey) {
      const key = normalizeDistrictKey(p.district ?? p.city);
      if (key !== districtKey && !(p.district ?? "").includes(districtKey)) {
        return false;
      }
    }

    if (filters.priceBand) {
      const priceTy = parsePriceTyLowerBound(p.priceRange);
      if (!matchesPriceBand(priceTy, filters.priceBand)) return false;
    }

    if (filters.bedrooms != null) {
      const max = p.maxBedrooms;
      const min = p.minBedrooms;
      if (max == null && min == null) return false;
      const ceiling = max ?? min ?? 0;
      if (ceiling < filters.bedrooms) return false;
    }

    return true;
  });
}

/** Build catalog href; amenity filters open the map instead. */
export function searchDestination(filters: ProjectFilters): string {
  if (filters.amenity && !filters.q && !filters.district && !filters.priceBand && filters.bedrooms == null) {
    return `/map?categories=${encodeURIComponent(filters.amenity)}`;
  }
  const query = projectFiltersToQuery({ ...filters, amenity: "" });
  const base = `/projects${query}`;
  if (filters.amenity) {
    const sep = query ? "&" : "?";
    return `${base}${sep}amenity=${encodeURIComponent(filters.amenity)}`;
  }
  return base || "/projects";
}
