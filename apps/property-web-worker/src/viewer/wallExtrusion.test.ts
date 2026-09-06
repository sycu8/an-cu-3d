import { describe, expect, it } from "vitest";
import type { Door, Wall, Window } from "@ancu/shared";
import {
  openingsForWall,
  planWallMeshes,
  solidSegmentsForWall,
  wallUnit,
} from "./wallExtrusion";

const wall: Wall = {
  id: "w1",
  start: [0, 0],
  end: [6, 0],
  thicknessM: 0.15,
  heightM: 2.8,
  exterior: true,
};

describe("wallExtrusion", () => {
  it("computes wall unit length", () => {
    expect(wallUnit(wall).length).toBeCloseTo(6);
  });

  it("splits solids around a door with lintel", () => {
    const doors: Door[] = [
      {
        id: "d1",
        wallId: "w1",
        offsetM: 1,
        widthM: 1,
        heightM: 2.1,
        swing: "left",
      },
    ];
    const openings = openingsForWall(wall, doors, []);
    const solids = solidSegmentsForWall(wall, openings);

    expect(openings).toHaveLength(1);
    expect(solids.some((s) => s.startM === 0 && s.endM === 1 && s.y0 === 0)).toBe(true);
    expect(solids.some((s) => s.startM === 2 && s.endM === 6 && s.y0 === 0)).toBe(true);
    expect(
      solids.some(
        (s) => s.startM === 1 && s.endM === 2 && s.y0 === 2.1 && s.y1 === 2.8,
      ),
    ).toBe(true);
  });

  it("builds sill and head around windows", () => {
    const windows: Window[] = [
      {
        id: "win1",
        wallId: "w1",
        offsetM: 2,
        widthM: 2,
        heightM: 1.2,
        sillHeightM: 0.9,
      },
    ];
    const openings = openingsForWall(wall, [], windows);
    const solids = solidSegmentsForWall(wall, openings);

    expect(solids.some((s) => s.y0 === 0 && s.y1 === 0.9 && s.startM === 2)).toBe(true);
    expect(solids.some((s) => s.y0 === 2.1 && s.y1 === 2.8 && s.startM === 2)).toBe(true);
  });

  it("plans meshes for multiple walls", () => {
    const walls: Wall[] = [
      wall,
      {
        id: "w2",
        start: [6, 0],
        end: [6, 4],
        thicknessM: 0.15,
        heightM: 2.8,
      },
    ];
    const plans = planWallMeshes(
      walls,
      [{ id: "d1", wallId: "w1", offsetM: 0.5, widthM: 0.9, heightM: 2.1, swing: "right" }],
      [{ id: "win1", wallId: "w2", offsetM: 1, widthM: 1.5, heightM: 1.2, sillHeightM: 0.9 }],
    );
    expect(plans).toHaveLength(2);
    expect(plans[0]!.openings[0]!.kind).toBe("door");
    expect(plans[1]!.openings[0]!.kind).toBe("window");
  });
});
