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
