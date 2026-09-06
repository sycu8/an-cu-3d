import { describe, expect, it } from "vitest";
import {
  filterProjectMedia,
  isUnitViewMode,
  type ProjectMediaItem,
} from "@ancu/shared";

const items: ProjectMediaItem[] = [
  {
    id: "1",
    kind: "floorplan_2d",
    url: "https://example.com/a.jpg",
    sortOrder: 2,
  },
  {
    id: "2",
    kind: "perspective",
    url: "https://example.com/b.jpg",
    sortOrder: 0,
    unitSlug: "studio-a",
  },
  {
    id: "3",
    kind: "perspective",
    url: "https://example.com/c.jpg",
    sortOrder: 1,
    unitSlug: "2br-b",
  },
  {
    id: "4",
    kind: "floorplan_2d",
    url: "https://example.com/d.jpg",
    sortOrder: 0,
  },
];

describe("project media view helpers", () => {
  it("recognizes unit view modes", () => {
    expect(isUnitViewMode("2d")).toBe(true);
    expect(isUnitViewMode("perspective")).toBe(true);
    expect(isUnitViewMode("3d")).toBe(true);
    expect(isUnitViewMode("auto")).toBe(true);
    expect(isUnitViewMode("top")).toBe(false);
    expect(isUnitViewMode(null)).toBe(false);
  });

  it("filters and sorts by kind", () => {
    const floorplans = filterProjectMedia(items, "floorplan_2d");
    expect(floorplans.map((i) => i.id)).toEqual(["4", "1"]);
  });

  it("keeps project-wide media when filtering by unit", () => {
    const forStudio = filterProjectMedia(items, "perspective", "studio-a");
    expect(forStudio.map((i) => i.id)).toEqual(["2"]);
    const forUnknown = filterProjectMedia(items, "floorplan_2d", "studio-a");
    expect(forUnknown.map((i) => i.id)).toEqual(["4", "1"]);
  });
});
