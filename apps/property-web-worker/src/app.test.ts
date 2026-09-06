import { describe, expect, it } from "vitest";
import { getProjectBySlug, getProjectSummaries } from "./data/gamuda-projects";
import { getSampleFloorPlan } from "./data/sample-floorplans";
import { documentBounds, wallLength } from "./viewer/utils";

describe("gamuda-projects seed", () => {
  it("lists at least 3 projects", () => {
    const projects = getProjectSummaries();
    expect(projects.length).toBeGreaterThanOrEqual(3);
  });

  it("finds project by slug", () => {
    const p = getProjectBySlug("celadon-city");
    expect(p?.name).toBe("Celadon City");
    expect(p?.developerName).toBe("Gamuda Land");
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
});

describe("demo-scale seed density", () => {
  it("merges sanitized demos into inventory (>=6 projects)", () => {
    const projects = getProjectSummaries();
    expect(projects.length).toBeGreaterThanOrEqual(6);
    const demos = projects.filter((proj) => proj.slug.startsWith("demo-"));
    expect(demos.length).toBeGreaterThanOrEqual(3);
    for (const d of demos) {
      expect(d.provenance?.toLowerCase()).toMatch(/demo|sanitized|fixture/);
      expect(d.priceRange).toBe("Chờ xác minh");
      expect(d.handover).toBe("Chờ xác minh");
    }
  });

  it("resolves demo apartment floorplan keys", () => {
    const riverside = getProjectBySlug("demo-riverside-haven");
    expect(riverside).toBeTruthy();
    expect(riverside!.apartmentTypes.length).toBeGreaterThan(0);
    for (const apt of riverside!.apartmentTypes) {
      const key = apt.floorplanKey ?? apt.slug;
      const doc = getSampleFloorPlan(key);
      expect(doc.walls.length).toBeGreaterThan(0);
      expect(doc.rooms.length).toBeGreaterThan(0);
    }
  });
});
