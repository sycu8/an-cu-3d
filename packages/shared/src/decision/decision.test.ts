import { describe, expect, it } from "vitest";
import { assessUnitFit } from "./fit.js";
import {
  normalizeWeights,
  preferredBedrooms,
  scoreWeightedDecision,
} from "./preferences.js";
import { parsePriceMidTrieu, rankProjects } from "./rank.js";

describe("decision weights", () => {
  it("normalizes weights to sum 1", () => {
    const n = normalizeWeights({
      budget: 90,
      space: 85,
      commute: 70,
      schools: 60,
      amenities: 40,
    });
    const sum = Object.values(n).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 5);
  });

  it("skips missing metrics instead of inventing scores", () => {
    const result = scoreWeightedDecision(
      { budget: 0.8, space: null, commute: null, schools: null, amenities: null },
      { budget: 100, space: 100, commute: 100, schools: 100, amenities: 100 },
    );
    expect(result.sufficient).toBe(true);
    expect(result.overall).toBe(80);
    expect(result.dimensions.filter((d) => d.available)).toHaveLength(1);
  });

  it("returns insufficient when no metrics", () => {
    const result = scoreWeightedDecision(
      {},
      { budget: 50, space: 50, commute: 50, schools: 50, amenities: 50 },
    );
    expect(result.sufficient).toBe(false);
    expect(result.overall).toBeNull();
  });
});

describe("unit fit", () => {
  it("maps household to bedroom targets", () => {
    expect(preferredBedrooms("solo")).toBe(1);
    expect(preferredBedrooms("family_2_children")).toBe(3);
  });

  it("scores bedroom match without geometry", () => {
    const result = assessUnitFit({
      preferences: { household: "couple", wfh: 0, vehicle: "no_car" },
      bedrooms: 2,
      floorplanVerified: false,
    });
    expect(result.sufficient).toBe(true);
    expect(result.overall).toBeGreaterThan(50);
    const space = result.components.find((c) => c.key === "space");
    expect(space?.score).toBe(1);
  });

  it("uses furniture geometry when verified", () => {
    const bedroom = {
      id: "br1",
      type: "bedroom",
      polygon: [
        [0, 0],
        [4, 0],
        [4, 3.5],
        [0, 3.5],
      ] as [number, number][],
    };
    const living = {
      id: "lv1",
      type: "living",
      polygon: [
        [0, 0],
        [5, 0],
        [5, 4],
        [0, 4],
      ] as [number, number][],
    };
    const result = assessUnitFit({
      preferences: { household: "couple", wfh: 1, vehicle: "no_car" },
      bedrooms: 2,
      rooms: [bedroom, living],
      floorplanVerified: true,
    });
    expect(result.sufficient).toBe(true);
    const layout = result.components.find((c) => c.key === "layout");
    expect(layout?.score).not.toBeNull();
  });
});

describe("project ranking", () => {
  it("ignores secondary-market price strings", () => {
    expect(parsePriceMidTrieu("Tham chiếu TT thứ cấp: 45–75")).toBeNull();
    expect(parsePriceMidTrieu("Từ 55–65 tr/m²")).toBe(60);
  });

  it("ranks closer project higher on commute when destination set", () => {
    const ranked = rankProjects(
      [
        {
          id: "1",
          slug: "near",
          name: "Near",
          latitude: 10.8,
          longitude: 106.7,
          amenityPoiCount: 1,
          schoolPoiCount: 0,
        },
        {
          id: "2",
          slug: "far",
          name: "Far",
          latitude: 10.9,
          longitude: 106.9,
          amenityPoiCount: 1,
          schoolPoiCount: 0,
        },
      ],
      { budget: 0, space: 0, commute: 100, schools: 0, amenities: 0 },
      { latitude: 10.8, longitude: 106.7 },
    );
    expect(ranked[0].candidate.slug).toBe("near");
    expect(ranked[0].result.sufficient).toBe(true);
  });
});
