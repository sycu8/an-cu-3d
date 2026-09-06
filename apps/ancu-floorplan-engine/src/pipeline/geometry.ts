import {
  CONFIDENCE_THRESHOLDS,
  documentNeedsHumanReview,
  validateFloorPlanTopology,
} from "@ancu/shared";
import { areaWithinTolerance } from "./areaDeviation";
import {
  isSharedFloorPlanDocument,
  safeParseFloorPlanDocument,
  type FloorPlanDocument,
} from "../schema/floorPlanDocument";

export type GeometryValidationResult =
  | {
      ok: true;
      document: FloorPlanDocument;
      confidence: number;
      needsReview: boolean;
    }
  | {
      ok: false;
      reason: string;
      needsReview: boolean;
    };

function sumRoomAreas(document: FloorPlanDocument): number {
  if (isSharedFloorPlanDocument(document)) {
    return document.rooms.reduce((sum, room) => sum + (room.areaSqM ?? 0), 0);
  }
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

  // Canonical shared documents: full topology + severity-aware confidence.
  if (isSharedFloorPlanDocument(document)) {
    const topology = validateFloorPlanTopology(document);
    if (!topology.ok) {
      return {
        ok: false,
        reason: topology.issues.find((i) => i.severity === "error")?.code ?? "topology_invalid",
        needsReview: true,
      };
    }

    const objectScores = [
      { kind: "scale", score: document.scale.confidence },
      { kind: "wall", score: document.confidence.walls ?? document.confidence.overall },
      { kind: "door", score: document.confidence.openings ?? document.confidence.overall },
      { kind: "room", score: document.confidence.rooms ?? document.confidence.overall },
    ];
    const needsReview =
      documentNeedsHumanReview(objectScores) ||
      document.confidence.overall < CONFIDENCE_THRESHOLDS.caution ||
      document.scale.estimated;

    return {
      ok: true,
      document,
      confidence: document.confidence.overall,
      needsReview,
    };
  }

  // Legacy minimal documents always need human review before publish-as-verified.
  const computed = sumRoomAreas(document);
  const stated = input.statedAreaSqm ?? document.statedAreaSqm;

  if (stated && computed > 0 && !areaWithinTolerance(stated, computed, 0.1)) {
    return {
      ok: false,
      reason: "area_deviation_exceeds_tolerance",
      needsReview: true,
    };
  }

  const confidence = computed > 0 ? 0.55 : stated ? 0.45 : 0.35;

  return {
    ok: true,
    document,
    confidence,
    needsReview: true,
  };
}
