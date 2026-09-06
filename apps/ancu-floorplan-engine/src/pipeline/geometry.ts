import { areaWithinTolerance } from "./areaDeviation";
import {
  safeParseFloorPlanDocument,
  type FloorPlanDocument,
} from "../schema/floorPlanDocument";

export type GeometryValidationResult =
  | {
      ok: true;
      document: FloorPlanDocument;
      confidence: number;
    }
  | {
      ok: false;
      reason: string;
      needsReview: boolean;
    };

function sumRoomAreas(document: FloorPlanDocument): number {
  return document.rooms.reduce((sum, room) => sum + (room.areaSqm ?? 0), 0);
}

export function validateGeometry(input: {
  seedDocument?: unknown;
  statedAreaSqm?: number;
}): GeometryValidationResult {
  if (!input.seedDocument) {
    return {
      ok: false,
      reason: "missing_seed_document",
      needsReview: true,
    };
  }

  const parsed = safeParseFloorPlanDocument(input.seedDocument);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_floorplan_document",
      needsReview: true,
    };
  }

  const document = parsed.data;
  const computed = sumRoomAreas(document);
  const stated = input.statedAreaSqm ?? document.statedAreaSqm;

  if (stated && computed > 0 && !areaWithinTolerance(stated, computed, 0.1)) {
    return {
      ok: false,
      reason: "area_deviation_exceeds_tolerance",
      needsReview: true,
    };
  }

  const confidence =
    computed > 0 ? 0.85 : stated ? 0.7 : 0.55;

  return {
    ok: true,
    document,
    confidence,
  };
}
