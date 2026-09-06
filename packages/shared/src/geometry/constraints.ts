import type { Vec2 } from "./vec2.js";
import { distance } from "./vec2.js";
import type { TopologyCheckResult, TopologyIssue } from "./validation.js";

const EPS = 1e-6;

function pointOnSegment(
  p: Vec2,
  a: Vec2,
  b: Vec2,
  toleranceM: number,
): boolean {
  const ab = distance(a, b);
  if (ab < EPS) return distance(p, a) <= toleranceM;
  const ap = distance(a, p);
  const bp = distance(b, p);
  return Math.abs(ap + bp - ab) <= toleranceM;
}

function projectOffsetOnWall(
  point: Vec2,
  start: Vec2,
  end: Vec2,
): number {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const len2 = dx * dx + dy * dy;
  if (len2 < EPS) return 0;
  const t = ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / len2;
  return Math.max(0, Math.min(1, t)) * Math.sqrt(len2);
}

/**
 * Verify openings reference existing walls and lie approximately on the wall segment.
 */
export function checkOpeningAttachment(input: {
  walls: Array<{ id: string; start: Vec2; end: Vec2 }>;
  doors: Array<{ id: string; wallId: string; offsetM: number; widthM: number }>;
  windows: Array<{ id: string; wallId: string; offsetM: number; widthM: number }>;
  toleranceM?: number;
}): TopologyCheckResult {
  const tolerance = input.toleranceM ?? 0.05;
  const issues: TopologyIssue[] = [];
  const wallMap = new Map(input.walls.map((w) => [w.id, w]));

  for (const door of input.doors) {
    const wall = wallMap.get(door.wallId);
    if (!wall) {
      issues.push({
        code: "door.wall_missing",
        message: `Door ${door.id} references missing wall ${door.wallId}`,
        entityIds: [door.id, door.wallId],
        severity: "error",
      });
      continue;
    }
    const wallLen = distance(wall.start, wall.end);
    if (door.offsetM < -tolerance || door.offsetM + door.widthM > wallLen + tolerance) {
      issues.push({
        code: "door.outside_wall",
        message: `Door ${door.id} extends outside wall ${door.wallId}`,
        entityIds: [door.id, door.wallId],
        severity: "error",
      });
    }
  }

  for (const win of input.windows) {
    const wall = wallMap.get(win.wallId);
    if (!wall) {
      issues.push({
        code: "window.wall_missing",
        message: `Window ${win.id} references missing wall ${win.wallId}`,
        entityIds: [win.id, win.wallId],
        severity: "error",
      });
      continue;
    }
    const wallLen = distance(wall.start, wall.end);
    if (win.offsetM < -tolerance || win.offsetM + win.widthM > wallLen + tolerance) {
      issues.push({
        code: "window.outside_wall",
        message: `Window ${win.id} extends outside wall ${win.wallId}`,
        entityIds: [win.id, win.wallId],
        severity: "error",
      });
    }
  }

  return { ok: issues.every((i) => i.severity !== "error"), issues };
}

/** Detect near-duplicate wall segments (same endpoints within tolerance). */
export function checkDuplicateWalls(
  walls: Array<{ id: string; start: Vec2; end: Vec2 }>,
  toleranceM = 0.02,
): TopologyCheckResult {
  const issues: TopologyIssue[] = [];
  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      const a = walls[i];
      const b = walls[j];
      const same =
        (distance(a.start, b.start) <= toleranceM &&
          distance(a.end, b.end) <= toleranceM) ||
        (distance(a.start, b.end) <= toleranceM &&
          distance(a.end, b.start) <= toleranceM);
      if (same) {
        issues.push({
          code: "wall.duplicate",
          message: `Walls ${a.id} and ${b.id} are duplicates`,
          entityIds: [a.id, b.id],
          severity: "warning",
        });
      }
    }
  }
  return { ok: issues.length === 0, issues };
}

/** Simple self-intersection check for room polygons (segment pairs). */
export function checkRoomSelfIntersection(
  rooms: Array<{ id: string; polygon: Vec2[] }>,
): TopologyCheckResult {
  const issues: TopologyIssue[] = [];
  for (const room of rooms) {
    const poly = room.polygon;
    const n = poly.length;
    if (n < 4) continue;
    for (let i = 0; i < n; i++) {
      const a1 = poly[i];
      const a2 = poly[(i + 1) % n];
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) continue;
        const b1 = poly[j];
        const b2 = poly[(j + 1) % n];
        if (segmentsIntersect(a1, a2, b1, b2)) {
          issues.push({
            code: "room.self_intersect",
            message: `Room ${room.id} polygon self-intersects`,
            entityIds: [room.id],
            severity: "error",
          });
          i = n;
          break;
        }
      }
    }
  }
  return { ok: issues.every((i) => i.severity !== "error"), issues };
}

function orient(a: Vec2, b: Vec2, c: Vec2): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function onSeg(a: Vec2, b: Vec2, p: Vec2): boolean {
  return (
    Math.min(a[0], b[0]) - EPS <= p[0] &&
    p[0] <= Math.max(a[0], b[0]) + EPS &&
    Math.min(a[1], b[1]) - EPS <= p[1] &&
    p[1] <= Math.max(a[1], b[1]) + EPS
  );
}

function segmentsIntersect(p1: Vec2, q1: Vec2, p2: Vec2, q2: Vec2): boolean {
  const o1 = orient(p1, q1, p2);
  const o2 = orient(p1, q1, q2);
  const o3 = orient(p2, q2, p1);
  const o4 = orient(p2, q2, q1);
  if (o1 * o2 < 0 && o3 * o4 < 0) return true;
  if (Math.abs(o1) < EPS && onSeg(p1, q1, p2)) return true;
  if (Math.abs(o2) < EPS && onSeg(p1, q1, q2)) return true;
  if (Math.abs(o3) < EPS && onSeg(p2, q2, p1)) return true;
  if (Math.abs(o4) < EPS && onSeg(p2, q2, q1)) return true;
  return false;
}

export function checkZeroAreaRooms(
  rooms: Array<{ id: string; polygon: Vec2[]; areaSqM?: number }>,
): TopologyCheckResult {
  const issues: TopologyIssue[] = [];
  for (const room of rooms) {
    const area =
      room.areaSqM ??
      Math.abs(
        room.polygon.reduce((sum, p, i, arr) => {
          const q = arr[(i + 1) % arr.length];
          return sum + (p[0] * q[1] - q[0] * p[1]);
        }, 0) / 2,
      );
    if (area < 0.05) {
      issues.push({
        code: "room.zero_area",
        message: `Room ${room.id} has near-zero area`,
        entityIds: [room.id],
        severity: "error",
      });
    }
  }
  return { ok: issues.every((i) => i.severity !== "error"), issues };
}

/** Snap nearly-parallel short gaps; merge duplicate endpoints within tolerance (metres). */
export function constrainWallNetwork(
  walls: Array<{ id: string; start: Vec2; end: Vec2; thicknessM?: number }>,
  snapToleranceM = 0.03,
): Array<{ id: string; start: Vec2; end: Vec2; thicknessM?: number }> {
  const points: Vec2[] = [];
  const snap = (p: Vec2): Vec2 => {
    for (const existing of points) {
      if (distance(existing, p) <= snapToleranceM) return existing;
    }
    points.push([p[0], p[1]]);
    return points[points.length - 1];
  };
  return walls.map((w) => ({
    ...w,
    start: snap(w.start),
    end: snap(w.end),
  }));
}

export { projectOffsetOnWall, pointOnSegment };
