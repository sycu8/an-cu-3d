import { polygonArea, type Vec2 } from "../geometry/vec2.js";
import {
  FURNITURE_DEFINITIONS,
  type FurnitureDefinition,
  getFurnitureDefinition,
} from "./definitions.js";

export type FurnitureFitVerdict = "comfortable" | "tight" | "does_not_fit";

export interface FurnitureFitResult {
  catalogId: string;
  roomId: string;
  verdict: FurnitureFitVerdict;
  roomAreaSqM: number;
  footprintAreaSqM: number;
  requiredClearanceAreaSqM: number;
  remainingCirculationM: number | null;
  explain: string;
}

function roomBounds(polygon: Vec2[]): { width: number; depth: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [x, y] of polygon) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return { width: maxX - minX, depth: maxY - minY };
}

/**
 * Axis-aligned bounding-box fit with clearance.
 * Deterministic — no LLM. Conservative: uses AABB of room polygon.
 */
export function evaluateFurnitureFit(input: {
  room: { id: string; polygon: Vec2[]; type?: string };
  furnitureId: string;
  definition?: FurnitureDefinition;
}): FurnitureFitResult | null {
  const def = input.definition ?? getFurnitureDefinition(input.furnitureId);
  if (!def) return null;
  if (input.room.polygon.length < 3) return null;

  const area = polygonArea(input.room.polygon);
  if (area <= 0) return null;

  const bounds = roomBounds(input.room.polygon);
  const fw = def.dimensionsM.width;
  const fd = def.dimensionsM.depth;
  const clearance = def.clearanceM;

  const fitsOrientationA =
    fw + 2 * clearance <= bounds.width && fd + clearance <= bounds.depth;
  const fitsOrientationB =
    fd + 2 * clearance <= bounds.width && fw + clearance <= bounds.depth;
  const fitsTightA = fw <= bounds.width && fd <= bounds.depth;
  const fitsTightB = fd <= bounds.width && fw <= bounds.depth;

  const footprint = fw * fd;
  const clearanceArea = (fw + 2 * clearance) * (fd + clearance);

  let verdict: FurnitureFitVerdict;
  let remaining: number | null = null;
  let explain: string;

  if (fitsOrientationA || fitsOrientationB) {
    verdict = "comfortable";
    const freeW = Math.max(bounds.width, bounds.depth) - Math.max(fw, fd);
    remaining = Math.max(0, freeW - clearance);
    explain = `${def.label} vừa với lối đi tối thiểu ${clearance.toFixed(1)} m.`;
  } else if (fitsTightA || fitsTightB) {
    verdict = "tight";
    remaining = Math.max(
      0,
      Math.min(bounds.width - fw, bounds.depth - fd),
    );
    explain = `${def.label} vừa khít — lối đi hẹp hơn khuyến nghị ${clearance.toFixed(1)} m.`;
  } else {
    verdict = "does_not_fit";
    remaining = null;
    explain = `${def.label} (${fw}×${fd} m) không vừa trong phòng ${bounds.width.toFixed(1)}×${bounds.depth.toFixed(1)} m.`;
  }

  return {
    catalogId: def.id,
    roomId: input.room.id,
    verdict,
    roomAreaSqM: area,
    footprintAreaSqM: footprint,
    requiredClearanceAreaSqM: clearanceArea,
    remainingCirculationM: remaining,
    explain,
  };
}

export function evaluateCommonBedroomFits(room: {
  id: string;
  polygon: Vec2[];
  type?: string;
}): FurnitureFitResult[] {
  return ["bed-queen", "bed-king", "wardrobe"]
    .map((id) => evaluateFurnitureFit({ room, furnitureId: id }))
    .filter((r): r is FurnitureFitResult => Boolean(r));
}

export function evaluateCommonLivingFits(room: {
  id: string;
  polygon: Vec2[];
  type?: string;
}): FurnitureFitResult[] {
  return ["sofa-2seat", "sofa-3seat", "sofa-l", "table-4seat"]
    .map((id) => evaluateFurnitureFit({ room, furnitureId: id }))
    .filter((r): r is FurnitureFitResult => Boolean(r));
}

export { FURNITURE_DEFINITIONS };
