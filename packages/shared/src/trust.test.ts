/**
 * Trust / furniture / spatial / topology regression tests.
 */
import { describe, expect, it } from "vitest";
import { sampleFloorPlans } from "./floorplan/samples/index.js";
import {
  canShowPreciseMeasurements,
  resolveFloorplanVerification,
  sourceClassToTrustState,
  floorplanVerificationLabel,
} from "./trust.js";
import { evaluateFurnitureFit } from "./furniture/fit.js";
import { computeSpatialMetrics, computeSpaceScore } from "./spatial/metrics.js";
import { validateFloorPlanTopology } from "./geometry/validation.js";
import { dispositionForConfidence } from "./floorplan/thresholds.js";
import { FloorPlanDocumentSchema } from "./floorplan/schema.js";

describe("trust semantics", () => {
  it("maps source classes to visitor trust states", () => {
    expect(sourceClassToTrustState("verified_public")).toBe("verified");
    expect(sourceClassToTrustState("estimated")).toBe("estimated");
    expect(sourceClassToTrustState("pending_verification")).toBe("pending_verification");
    expect(sourceClassToTrustState(undefined)).toBe("unknown");
  });

  it("flags bedroom-count mismatch as illustrative", () => {
    const status = resolveFloorplanVerification({
      hasDocument: true,
      requestedBedrooms: 3,
      documentBedroomCount: 2,
      documentSourceClass: "seed_estimated",
    });
    expect(status).toBe("illustrative");
    expect(floorplanVerificationLabel(status)).toMatch(/minh họa/i);
  });

  it("suppresses precise measurements for estimated scale", () => {
    expect(
      canShowPreciseMeasurements({
        scaleConfidence: 0.5,
        scaleEstimated: true,
        verificationStatus: "estimated",
      }),
    ).toBe(false);
  });
});

describe("furniture fit", () => {
  it("rejects a king bed in a tiny room", () => {
    const result = evaluateFurnitureFit({
      room: {
        id: "r1",
        type: "bedroom",
        polygon: [
          [0, 0],
          [1.5, 0],
          [1.5, 1.5],
          [0, 1.5],
        ],
      },
      furnitureId: "bed-king",
    });
    expect(result?.verdict).toBe("does_not_fit");
  });

  it("accepts a queen bed in a spacious bedroom", () => {
    const result = evaluateFurnitureFit({
      room: {
        id: "r1",
        type: "bedroom",
        polygon: [
          [0, 0],
          [4, 0],
          [4, 3.5],
          [0, 3.5],
        ],
      },
      furnitureId: "bed-queen",
    });
    expect(result?.verdict).toBe("comfortable");
  });
});

describe("spatial metrics", () => {
  it("computes usable area from sample floorplan", () => {
    const doc = sampleFloorPlans.twoBedroomCeladonCity;
    const metrics = computeSpatialMetrics({
      rooms: doc.rooms,
      netAreaSqM: doc.netAreaSqM,
    });
    expect(metrics.sufficientGeometry).toBe(true);
    expect(metrics.usableAreaSqM).toBeGreaterThan(0);
  });

  it("does not invent a space score without fit inputs", () => {
    expect(
      computeSpaceScore({
        layoutEfficiencyRatio: 0.8,
        bedroomCount: 2,
        hasStorage: false,
        fitComfortableCount: 0,
        fitTotalCount: 0,
      }),
    ).toBeNull();
  });
});

describe("topology validation", () => {
  it("validates sample documents without critical errors", () => {
    const doc = sampleFloorPlans.studioEatonPark;
    const result = validateFloorPlanTopology(doc);
    expect(result.ok).toBe(true);
  });

  it("flags floating doors", () => {
    const doc = structuredClone(sampleFloorPlans.studioEatonPark);
    doc.doors.push({
      id: "door_float",
      wallId: "missing_wall",
      offsetM: 0.5,
      widthM: 0.9,
      heightM: 2.1,
      swing: "unknown",
    });
    const result = validateFloorPlanTopology(doc);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "door.wall_missing")).toBe(true);
  });
});

describe("review thresholds", () => {
  it("requires review for low-confidence walls", () => {
    expect(dispositionForConfidence(0.7, "wall")).toBe("needs_review");
    expect(dispositionForConfidence(0.95, "wall")).toBe("auto_accept");
    expect(dispositionForConfidence(0.55, "furniture")).toBe("caution");
  });
});

describe("schema backwards compatibility", () => {
  it("still parses samples after optional confidence fields", () => {
    for (const doc of Object.values(sampleFloorPlans)) {
      expect(() => FloorPlanDocumentSchema.parse(doc)).not.toThrow();
    }
  });
});
