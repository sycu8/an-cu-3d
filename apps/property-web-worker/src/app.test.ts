import { describe, expect, it } from "vitest";
import { getProjectBySlug, getProjectSummaries } from "./data/gamuda-projects";
import { getSampleFloorPlan } from "./data/sample-floorplans";
import { documentBounds, wallLength } from "./viewer/utils";
import { buildFurnitureDef, furnitureStyleFromPaletteLabel } from "./viewer/furnitureCatalog";

describe("project seed inventory", () => {
  it("lists Gamuda + Vinhomes + Ecopark + Đất Xanh/Bluemarq projects", () => {
    const projects = getProjectSummaries();
    expect(projects.length).toBeGreaterThanOrEqual(8);
    const developers = new Set(projects.map((p) => p.developerName));
    expect([...developers].some((d) => d.includes("Gamuda"))).toBe(true);
    expect([...developers].some((d) => d.includes("Vinhomes"))).toBe(true);
    expect([...developers].some((d) => d.includes("Ecopark"))).toBe(true);
    expect([...developers].some((d) => d.includes("Đất Xanh") || d.includes("Bluemarq"))).toBe(
      true,
    );
  });

  it("does not include sanitized demo-* fixtures", () => {
    const demos = getProjectSummaries().filter((p) => p.slug.startsWith("demo-"));
    expect(demos).toHaveLength(0);
  });

  it("finds Celadon City by slug", () => {
    const p = getProjectBySlug("celadon-city");
    expect(p?.name).toBe("Celadon City");
    expect(p?.developerName).toContain("Gamuda");
  });

  it("includes handover + document metadata on Vinhomes Grand Park", () => {
    const p = getProjectBySlug("vinhomes-grand-park");
    expect(p?.handoverUnits?.length).toBeGreaterThan(0);
    expect(p?.documents?.length).toBeGreaterThan(0);
    expect(p?.priceRange).toMatch(/thứ cấp/i);
    expect(p?.priceProvenance).toBeTruthy();
    const threeBr = p?.apartmentTypes.find((a) => a.bedrooms === 3);
    expect(threeBr?.floorplanKey).toBeUndefined();
    expect(threeBr?.floorplanVerification).toBe("unknown");
  });

  it("does not map 3BR Grand Park units onto 2BR sample keys", () => {
    const p = getProjectBySlug("vinhomes-grand-park");
    for (const apt of p?.apartmentTypes ?? []) {
      if (apt.bedrooms === 3) {
        expect(apt.floorplanKey).toBeFalsy();
      }
      if (apt.floorplanKey === "2br-c") {
        expect(apt.bedrooms).toBe(2);
      }
    }
  });

  it("includes Opal Boulevard as handed-over Đất Xanh inventory", () => {
    const p = getProjectBySlug("opal-boulevard");
    expect(p?.handover).toMatch(/bàn giao/i);
    expect(p?.handoverUnits?.some((u) => u.status === "handed_over")).toBe(true);
  });
});

describe("floor plan samples", () => {
  it("returns a document with walls and rooms", () => {
    const doc = getSampleFloorPlan("studio-a");
    expect(doc.walls.length).toBeGreaterThan(0);
    expect(doc.rooms.length).toBeGreaterThan(0);
    expect(doc.coordinateUnit).toBe("meter");
  });

  it("computes document bounds", () => {
    const doc = getSampleFloorPlan("1br-b");
    const bounds = documentBounds(doc);
    expect(bounds.size).toBeGreaterThan(0);
  });

  it("computes wall length", () => {
    const doc = getSampleFloorPlan("studio-a");
    const len = wallLength(doc.walls[0]);
    expect(len).toBeGreaterThan(0);
  });

  it("refuses mismatched bedroom geometry via resolveFloorPlanForUnit", async () => {
    const { resolveFloorPlanForUnit } = await import("./data/sample-floorplans");
    const bad = resolveFloorPlanForUnit({
      floorplanKey: "2br-c",
      bedrooms: 3,
    });
    expect(bad.document).toBeNull();
    expect(bad.verificationStatus).toBe("illustrative");
  });
});

describe("RealEstateOS-inspired furniture icons", () => {
  it("builds multi-part meshes for beds and sofas", () => {
    const bed = buildFurnitureDef("bed-queen", "scandinavian");
    expect(bed.parts.length).toBeGreaterThan(2);
    const sofa = buildFurnitureDef("sofa-3seat", "modern");
    expect(sofa.parts.length).toBeGreaterThan(2);
  });

  it("maps palette labels to staging styles", () => {
    expect(furnitureStyleFromPaletteLabel("Ivory ấm")).toBe("scandinavian");
    expect(furnitureStyleFromPaletteLabel("Teal hiện đại")).toBe("luxury");
  });
});
