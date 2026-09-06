import { describe, expect, it } from "vitest";
import { sampleFloorPlans } from "./index.js";
import { FloorPlanDocumentSchema } from "../schema.js";
import studioRaw from "./studio-eaton-park.json" with { type: "json" };
import oneBedRaw from "./one-bedroom-elysian.json" with { type: "json" };
import twoBedRaw from "./two-bedroom-celadon-city.json" with { type: "json" };

const rawSamples = [studioRaw, oneBedRaw, twoBedRaw];

describe("FloorPlanDocument samples", () => {
  it("parses all raw JSON samples with Zod", () => {
    for (const sample of rawSamples) {
      expect(() => FloorPlanDocumentSchema.parse(sample)).not.toThrow();
    }
  });

  it("exports three distinct layout types", () => {
    expect(sampleFloorPlans.studioEatonPark.bedroomCount).toBe(0);
    expect(sampleFloorPlans.oneBedroomElysian.bedroomCount).toBe(1);
    expect(sampleFloorPlans.twoBedroomCeladonCity.bedroomCount).toBe(2);
  });

  it("marks estimated seeds with sub-1 scale confidence", () => {
    for (const doc of Object.values(sampleFloorPlans)) {
      expect(doc.scale.estimated).toBe(true);
      expect(doc.scale.confidence).toBeLessThan(1);
      expect(doc.source.sourceClass).toBe("seed_estimated");
    }
  });
});

describe("geometry helpers", () => {
  it("computes wall segment length", async () => {
    const { segmentLength } = await import("../../geometry/walls.js");
    expect(segmentLength({ id: "w", start: [0, 0], end: [3, 4] })).toBe(5);
  });

  it("reports area deviation percent", async () => {
    const { areaDeviationPercent } = await import("../../geometry/validation.js");
    expect(areaDeviationPercent(105, 100)).toBeCloseTo(5);
  });
});

describe("r2 path helpers", () => {
  it("builds published document keys", async () => {
    const { publishedFloorPlanDocumentKey } = await import("../../r2-paths.js");
    expect(publishedFloorPlanDocumentKey("eaton-park", "doc-1")).toBe(
      "floorplans/published/eaton-park/doc-1/floorplan-latest.json",
    );
  });
});

describe("design tokens", () => {
  it("exposes brand palette from master prompt", async () => {
    const { palette, tokens } = await import("../../tokens.js");
    expect(palette.primary).toBe("#285A52");
    expect(tokens.brandPrimary).toBe(palette.primary);
    expect(tokens.mapPassive).toBe(palette.sage);
  });
});
