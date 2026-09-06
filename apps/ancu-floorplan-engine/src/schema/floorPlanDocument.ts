import { z } from "zod";

/** Minimal local FloorPlanDocument until @ancu/shared exports the canonical schema. */
export const floorPlanRoomSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  areaSqm: z.number().positive().optional(),
});

export const floorPlanDocumentSchema = z.object({
  id: z.string(),
  projectSlug: z.string(),
  unitType: z.string().optional(),
  statedAreaSqm: z.number().positive().optional(),
  rooms: z.array(floorPlanRoomSchema).default([]),
  walls: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))).default([]),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export type FloorPlanDocument = z.infer<typeof floorPlanDocumentSchema>;

export function parseFloorPlanDocument(input: unknown): FloorPlanDocument {
  return floorPlanDocumentSchema.parse(input);
}

export function safeParseFloorPlanDocument(input: unknown) {
  return floorPlanDocumentSchema.safeParse(input);
}
