import type { Door, Wall, Window } from "@ancu/shared";

export type WallOpening =
  | { kind: "door"; id: string; startM: number; endM: number; heightM: number; swing: Door["swing"] }
  | {
      kind: "window";
      id: string;
      startM: number;
      endM: number;
      heightM: number;
      sillHeightM: number;
    };

export type WallSolidSegment = {
  startM: number;
  endM: number;
  /** Bottom of solid block (meters). */
  y0: number;
  /** Top of solid block (meters). */
  y1: number;
};

export type WallMeshPlan = {
  wall: Wall;
  length: number;
  ux: number;
  uz: number;
  openings: WallOpening[];
  solids: WallSolidSegment[];
};

export function wallUnit(wall: Wall): { ux: number; uz: number; length: number } {
  const dx = wall.end[0] - wall.start[0];
  const dz = wall.end[1] - wall.start[1];
  const length = Math.hypot(dx, dz);
  if (length < 1e-6) return { ux: 1, uz: 0, length: 0 };
  return { ux: dx / length, uz: dz / length, length };
}

/** Collect door/window openings on a wall, clamped to wall length. */
export function openingsForWall(
  wall: Wall,
  doors: Door[],
  windows: Window[],
): WallOpening[] {
  const { length } = wallUnit(wall);
  const openings: WallOpening[] = [];

  for (const door of doors) {
    if (door.wallId !== wall.id) continue;
    const startM = Math.max(0, Math.min(door.offsetM, length));
    const endM = Math.max(startM, Math.min(door.offsetM + door.widthM, length));
    if (endM - startM < 0.05) continue;
    openings.push({
      kind: "door",
      id: door.id,
      startM,
      endM,
      heightM: Math.min(door.heightM, wall.heightM),
      swing: door.swing,
    });
  }

  for (const win of windows) {
    if (win.wallId !== wall.id) continue;
    const startM = Math.max(0, Math.min(win.offsetM, length));
    const endM = Math.max(startM, Math.min(win.offsetM + win.widthM, length));
    if (endM - startM < 0.05) continue;
    openings.push({
      kind: "window",
      id: win.id,
      startM,
      endM,
      heightM: Math.min(win.heightM, wall.heightM),
      sillHeightM: Math.max(0, Math.min(win.sillHeightM, wall.heightM)),
    });
  }

  return openings.sort((a, b) => a.startM - b.startM);
}

/**
 * Split a wall into solid masonry blocks around door/window openings
 * (lintels above doors, sill + head around windows).
 */
export function solidSegmentsForWall(
  wall: Wall,
  openings: WallOpening[],
): WallSolidSegment[] {
  const { length } = wallUnit(wall);
  if (length < 1e-4) return [];

  const solids: WallSolidSegment[] = [];
  const sorted = [...openings].sort((a, b) => a.startM - b.startM);

  let cursor = 0;
  for (const opening of sorted) {
    if (opening.startM > cursor + 0.01) {
      solids.push({ startM: cursor, endM: opening.startM, y0: 0, y1: wall.heightM });
    }

    if (opening.kind === "door") {
      if (opening.heightM < wall.heightM - 0.02) {
        solids.push({
          startM: opening.startM,
          endM: opening.endM,
          y0: opening.heightM,
          y1: wall.heightM,
        });
      }
    } else {
      if (opening.sillHeightM > 0.02) {
        solids.push({
          startM: opening.startM,
          endM: opening.endM,
          y0: 0,
          y1: opening.sillHeightM,
        });
      }
      const head = opening.sillHeightM + opening.heightM;
      if (head < wall.heightM - 0.02) {
        solids.push({
          startM: opening.startM,
          endM: opening.endM,
          y0: head,
          y1: wall.heightM,
        });
      }
    }

    cursor = Math.max(cursor, opening.endM);
  }

  if (cursor < length - 0.01) {
    solids.push({ startM: cursor, endM: length, y0: 0, y1: wall.heightM });
  }

  if (solids.length === 0 && sorted.length === 0) {
    solids.push({ startM: 0, endM: length, y0: 0, y1: wall.heightM });
  }

  return solids.filter((s) => s.endM - s.startM > 0.02 && s.y1 - s.y0 > 0.02);
}

export function planWallMeshes(
  walls: Wall[],
  doors: Door[],
  windows: Window[],
): WallMeshPlan[] {
  return walls.map((wall) => {
    const { ux, uz, length } = wallUnit(wall);
    const openings = openingsForWall(wall, doors, windows);
    const solids = solidSegmentsForWall(wall, openings);
    return { wall, length, ux, uz, openings, solids };
  });
}

/** World-space center of a span along a wall. */
export function spanCenter(
  wall: Wall,
  startM: number,
  endM: number,
  y: number,
): [number, number, number] {
  const { ux, uz } = wallUnit(wall);
  const mid = (startM + endM) / 2;
  return [wall.start[0] + ux * mid, y, wall.start[1] + uz * mid];
}
