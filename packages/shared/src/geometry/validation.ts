import type { Vec2 } from "./vec2.js";
import { polygonArea } from "./vec2.js";

export interface TopologyIssue {
  code: string;
  message: string;
  entityIds?: string[];
}

export interface TopologyCheckResult {
  ok: boolean;
  issues: TopologyIssue[];
}

export function areaDeviationPercent(computedArea: number, expectedArea: number): number {
  if (expectedArea <= 0) return computedArea === 0 ? 0 : 100;
  return (Math.abs(computedArea - expectedArea) / expectedArea) * 100;
}

export function checkRoomPolygons(
  rooms: Array<{ id: string; polygon: Vec2[] }>,
): TopologyCheckResult {
  const issues: TopologyIssue[] = [];
  for (const room of rooms) {
    if (room.polygon.length < 3) {
      issues.push({
        code: "room.polygon.too_few_vertices",
        message: `Room ${room.id} needs at least 3 polygon vertices`,
        entityIds: [room.id],
      });
    }
  }
  return { ok: issues.length === 0, issues };
}

export function checkWallSegments(
  walls: Array<{ id: string; start: Vec2; end: Vec2 }>,
  minLength = 0.05,
): TopologyCheckResult {
  const issues: TopologyIssue[] = [];
  for (const wall of walls) {
    const len = Math.hypot(wall.end[0] - wall.start[0], wall.end[1] - wall.start[1]);
    if (len < minLength) {
      issues.push({
        code: "wall.segment.too_short",
        message: `Wall ${wall.id} is shorter than ${minLength}m`,
        entityIds: [wall.id],
      });
    }
  }
  return { ok: issues.length === 0, issues };
}

export function checkAreaConsistency(
  rooms: Array<{ id: string; polygon: Vec2[] }>,
  declaredNetAreaSqM?: number,
  tolerancePercent = 8,
): TopologyCheckResult {
  const issues: TopologyIssue[] = [];
  const computed = rooms.reduce((sum, room) => sum + polygonArea(room.polygon), 0);
  if (declaredNetAreaSqM != null) {
    const deviation = areaDeviationPercent(computed, declaredNetAreaSqM);
    if (deviation > tolerancePercent) {
      issues.push({
        code: "area.net_mismatch",
        message: `Computed ${computed.toFixed(2)}m² vs declared ${declaredNetAreaSqM}m² (${deviation.toFixed(1)}%)`,
      });
    }
  }
  return { ok: issues.length === 0, issues };
}
