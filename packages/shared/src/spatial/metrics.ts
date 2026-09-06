import { polygonArea, type Vec2 } from "../geometry/vec2.js";

export interface RoomAreaMetric {
  roomId: string;
  name?: string;
  type?: string;
  areaSqM: number;
}

export interface SpatialMetrics {
  usableAreaSqM: number;
  roomAreas: RoomAreaMetric[];
  /** Rough circulation estimate = corridor rooms + 8% of non-corridor when no corridor rooms. */
  circulationEstimateSqM: number;
  layoutEfficiency: number | null;
  sufficientGeometry: boolean;
}

/**
 * Compute basic spatial metrics from room polygons.
 * Returns sufficientGeometry=false when polygons are missing/invalid —
 * callers must not invent scores.
 */
export function computeSpatialMetrics(input: {
  rooms: Array<{ id: string; name?: string; type?: string; polygon: Vec2[]; areaSqM?: number }>;
  netAreaSqM?: number;
}): SpatialMetrics {
  const roomAreas: RoomAreaMetric[] = [];
  let usable = 0;
  let corridor = 0;
  let validRooms = 0;

  for (const room of input.rooms) {
    if (!room.polygon || room.polygon.length < 3) continue;
    const area = room.areaSqM && room.areaSqM > 0 ? room.areaSqM : polygonArea(room.polygon);
    if (area <= 0) continue;
    validRooms += 1;
    usable += area;
    if (room.type === "corridor") corridor += area;
    roomAreas.push({
      roomId: room.id,
      name: room.name,
      type: room.type,
      areaSqM: Math.round(area * 100) / 100,
    });
  }

  if (validRooms === 0) {
    return {
      usableAreaSqM: 0,
      roomAreas: [],
      circulationEstimateSqM: 0,
      layoutEfficiency: null,
      sufficientGeometry: false,
    };
  }

  const circulation =
    corridor > 0 ? corridor : Math.round(usable * 0.08 * 100) / 100;
  const net = input.netAreaSqM && input.netAreaSqM > 0 ? input.netAreaSqM : usable;
  const efficiency =
    net > 0 ? Math.round(((usable - circulation) / net) * 1000) / 1000 : null;

  return {
    usableAreaSqM: Math.round(usable * 100) / 100,
    roomAreas,
    circulationEstimateSqM: Math.round(circulation * 100) / 100,
    layoutEfficiency: efficiency,
    sufficientGeometry: true,
  };
}

export interface SpaceScoreBreakdown {
  layoutEfficiency: number;
  furnitureFlexibility: number;
  storagePotential: number;
  overall: number;
  inputs: {
    layoutEfficiencyRatio: number;
    bedroomCount: number;
    hasStorage: boolean;
    fitComfortableCount: number;
    fitTotalCount: number;
  };
  explainVi: string;
}

/**
 * Deterministic space score — only when geometry + fit inputs exist.
 * Formula (documented):
 *   layout = clamp(layoutEfficiencyRatio, 0..1) * 40
 *   furniture = (comfortable / total) * 35  (0 if no fits evaluated)
 *   storage = hasStorage ? 25 : bedroomCount >= 2 ? 12 : 8
 *   overall = sum / 100 * 100 scaled 0–100
 */
export function computeSpaceScore(input: {
  layoutEfficiencyRatio: number | null;
  bedroomCount: number;
  hasStorage: boolean;
  fitComfortableCount: number;
  fitTotalCount: number;
}): SpaceScoreBreakdown | null {
  if (input.layoutEfficiencyRatio == null || !Number.isFinite(input.layoutEfficiencyRatio)) {
    return null;
  }
  if (input.fitTotalCount <= 0) return null;

  const layoutRatio = Math.min(1, Math.max(0, input.layoutEfficiencyRatio));
  const layoutEfficiency = layoutRatio * 40;
  const furnitureFlexibility =
    (input.fitComfortableCount / input.fitTotalCount) * 35;
  const storagePotential = input.hasStorage ? 25 : input.bedroomCount >= 2 ? 12 : 8;
  const overall = Math.round(layoutEfficiency + furnitureFlexibility + storagePotential);

  return {
    layoutEfficiency: Math.round(layoutEfficiency * 10) / 10,
    furnitureFlexibility: Math.round(furnitureFlexibility * 10) / 10,
    storagePotential,
    overall,
    inputs: {
      layoutEfficiencyRatio: layoutRatio,
      bedroomCount: input.bedroomCount,
      hasStorage: input.hasStorage,
      fitComfortableCount: input.fitComfortableCount,
      fitTotalCount: input.fitTotalCount,
    },
    explainVi: `Điểm không gian ${overall}/100 từ hiệu quả mặt bằng (${Math.round(layoutRatio * 100)}%), linh hoạt nội thất (${input.fitComfortableCount}/${input.fitTotalCount} vừa thoải mái), và tiềm năng lưu trữ.`,
  };
}
