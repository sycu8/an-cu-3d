import { describe, expect, it } from "vitest";
import {
  districtProjectCounts,
  emptyProjectFilters,
  filterProjects,
  normalizeDistrictKey,
  parsePriceTyLowerBound,
  parseProjectFilters,
  projectFiltersToQuery,
  searchDestination,
} from "./projectFilters";
import type { ProjectSummary } from "../types";

const sample: ProjectSummary[] = [
  {
    id: "1",
    slug: "a",
    name: "Vinhomes Grand Park",
    developerName: "Vinhomes",
    district: "TP. Thủ Đức",
    city: "TP. Hồ Chí Minh",
    handover: "Đã bàn giao",
    priceRange: "từ 3,2 tỷ (tham chiếu thứ cấp)",
    totalUnits: "1000",
    sourceClass: "verified_public",
    minBedrooms: 1,
    maxBedrooms: 3,
  },
  {
    id: "2",
    slug: "b",
    name: "Celadon City",
    developerName: "Gamuda Land",
    district: "Tân Phú",
    city: "TP. Hồ Chí Minh",
    handover: "Đã bàn giao",
    priceRange: "Chờ xác minh",
    totalUnits: "500",
    sourceClass: "estimated",
    minBedrooms: 2,
    maxBedrooms: 4,
  },
];

describe("projectFilters", () => {
  it("normalizes Thủ Đức variants", () => {
    expect(normalizeDistrictKey("TP. Thủ Đức (An Phú / Bình Trưng)")).toBe("TP. Thủ Đức");
  });

  it("parses price lower bound and skips pending", () => {
    expect(parsePriceTyLowerBound("từ 3,2 tỷ (tham chiếu thứ cấp)")).toBeCloseTo(3.2);
    expect(parsePriceTyLowerBound("Chờ xác minh")).toBeNull();
  });

  it("filters by district and bedrooms", () => {
    const filtered = filterProjects(sample, {
      ...emptyProjectFilters(),
      district: "TP. Thủ Đức",
      bedrooms: 3,
    });
    expect(filtered.map((p) => p.slug)).toEqual(["a"]);
  });

  it("excludes pending prices from price-band filter", () => {
    const filtered = filterProjects(sample, {
      ...emptyProjectFilters(),
      priceBand: "2-4",
    });
    expect(filtered.map((p) => p.slug)).toEqual(["a"]);
  });

  it("serializes and parses URL filters", () => {
    const query = projectFiltersToQuery({
      q: "vinhomes",
      district: "TP. Thủ Đức",
      priceBand: "2-4",
      bedrooms: 2,
      amenity: "education",
    });
    expect(query).toContain("q=vinhomes");
    const parsed = parseProjectFilters(new URLSearchParams(query.slice(1)));
    expect(parsed.district).toBe("TP. Thủ Đức");
    expect(parsed.bedrooms).toBe(2);
    expect(parsed.priceBand).toBe("2-4");
  });

  it("routes amenity-only search to map", () => {
    expect(
      searchDestination({
        ...emptyProjectFilters(),
        amenity: "hospital",
      }),
    ).toBe("/map?categories=hospital");
  });

  it("counts districts", () => {
    const counts = districtProjectCounts(sample);
    expect(counts[0]?.district).toBeTruthy();
    expect(counts.reduce((s, c) => s + c.count, 0)).toBe(2);
  });
});
