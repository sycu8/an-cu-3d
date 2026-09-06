import { describe, expect, it } from "vitest";
import { sampleFloorPlans } from "@ancu/shared";
import { validateGeometry } from "../src/pipeline/geometry";

describe("geometry validation", () => {
  it("requires seed document", () => {
    const result = validateGeometry({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("missing_seed_document");
      expect(result.needsReview).toBe(true);
    }
  });

  it("accepts shared FloorPlanDocument with topology pass but needs review when scale estimated", () => {
    const result = validateGeometry({
      seedDocument: sampleFloorPlans.studioEatonPark,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.needsReview).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
    }
  });

  it("rejects floating door on shared document", () => {
    const doc = structuredClone(sampleFloorPlans.studioEatonPark);
    doc.doors.push({
      id: "door_float",
      wallId: "no_such_wall",
      offsetM: 0.4,
      widthM: 0.9,
      heightM: 2.1,
      swing: "unknown",
    });
    const result = validateGeometry({ seedDocument: doc });
    expect(result.ok).toBe(false);
  });

  it("marks legacy minimal documents as needs_review", () => {
    const result = validateGeometry({
      seedDocument: {
        id: "legacy-1",
        projectSlug: "demo",
        statedAreaSqm: 50,
        rooms: [{ id: "r1", areaSqm: 48 }],
        walls: [],
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.needsReview).toBe(true);
      expect(result.confidence).toBeLessThan(0.9);
    }
  });
});
