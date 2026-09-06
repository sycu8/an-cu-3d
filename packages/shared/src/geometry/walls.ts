import type { Vec2 } from "./vec2.js";
import { distance, nearlyEqual, sub } from "./vec2.js";

export interface WallSegment {
  id: string;
  start: Vec2;
  end: Vec2;
}

const COLLINEAR_ANGLE_EPS = 0.02;

export function segmentLength(wall: WallSegment): number {
  return distance(wall.start, wall.end);
}

/** Snap wall endpoints to a meter grid (deterministic rounding). */
export function snapVertices(walls: WallSegment[], gridSize = 0.01): WallSegment[] {
  const snap = (v: Vec2): Vec2 => [
    Math.round(v[0] / gridSize) * gridSize,
    Math.round(v[1] / gridSize) * gridSize,
  ];

  return walls.map((wall) => ({
    ...wall,
    start: snap(wall.start),
    end: snap(wall.end),
  }));
}

/** Merge adjacent collinear segments that share an endpoint (same orientation). */
export function mergeCollinear(
  walls: WallSegment[],
  tolerance = 0.02,
): WallSegment[] {
  const merged: WallSegment[] = [];
  const used = new Set<string>();

  for (const wall of walls) {
    if (used.has(wall.id)) continue;

    let current = { ...wall };
    used.add(current.id);

    let extended = true;
    while (extended) {
      extended = false;
      for (const candidate of walls) {
        if (used.has(candidate.id)) continue;
        if (!isCollinear(current, candidate, tolerance)) continue;

        if (nearlyEqual(current.end, candidate.start, tolerance)) {
          current = { ...current, end: candidate.end };
          used.add(candidate.id);
          extended = true;
        } else if (nearlyEqual(current.start, candidate.end, tolerance)) {
          current = { ...current, start: candidate.start };
          used.add(candidate.id);
          extended = true;
        }
      }
    }

    merged.push(current);
  }

  return merged;
}

function isCollinear(a: WallSegment, b: WallSegment, tolerance: number): boolean {
  const dirA = normalizeSafe(sub(a.end, a.start));
  const dirB = normalizeSafe(sub(b.end, b.start));
  const cross = Math.abs(dirA[0] * dirB[1] - dirA[1] * dirB[0]);
  return cross <= COLLINEAR_ANGLE_EPS && (
    nearlyEqual(a.end, b.start, tolerance) || nearlyEqual(a.start, b.end, tolerance)
  );
}

function normalizeSafe(v: Vec2): Vec2 {
  const len = Math.hypot(v[0], v[1]);
  if (len === 0) return [0, 0];
  return [v[0] / len, v[1] / len];
}
