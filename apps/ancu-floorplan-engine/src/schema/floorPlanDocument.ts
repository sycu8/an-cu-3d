/**
 * Engine FloorPlanDocument adapter.
 * Canonical schema lives in @ancu/shared. Legacy minimal documents (crawl stubs)
 * are still accepted and upgraded into a review-needed shell.
 */
import {
  safeParseFloorPlanDocument as safeParseShared,
  type FloorPlanDocument as SharedFloorPlanDocument,
} from "@ancu/shared";
import { z } from "zod";

/** Legacy minimal document used by early crawl/seed jobs. */
export const legacyFloorPlanRoomSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  areaSqm: z.number().positive().optional(),
});

export const legacyFloorPlanDocumentSchema = z.object({
  id: z.string(),
  projectSlug: z.string(),
  unitType: z.string().optional(),
  statedAreaSqm: z.number().positive().optional(),
  rooms: z.array(legacyFloorPlanRoomSchema).default([]),
  walls: z
    .array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])))
    .default([]),
  metadata: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
});

export type LegacyFloorPlanDocument = z.infer<typeof legacyFloorPlanDocumentSchema>;
export type FloorPlanDocument = SharedFloorPlanDocument | LegacyFloorPlanDocument;

export function isSharedFloorPlanDocument(
  doc: FloorPlanDocument,
): doc is SharedFloorPlanDocument {
  return (
    typeof doc === "object" &&
    doc !== null &&
    "schemaVersion" in doc &&
    (doc as { schemaVersion?: number }).schemaVersion === 1
  );
}

export function safeParseFloorPlanDocument(input: unknown) {
  const shared = safeParseShared(input);
  if (shared.success) {
    return { success: true as const, data: shared.data, kind: "shared" as const };
  }
  const legacy = legacyFloorPlanDocumentSchema.safeParse(input);
  if (legacy.success) {
    return { success: true as const, data: legacy.data, kind: "legacy" as const };
  }
  return {
    success: false as const,
    error: shared.error ?? legacy.error,
    kind: "invalid" as const,
  };
}

export function parseFloorPlanDocument(input: unknown): FloorPlanDocument {
  const parsed = safeParseFloorPlanDocument(input);
  if (!parsed.success) {
    throw new Error("invalid_floorplan_document");
  }
  return parsed.data;
}
