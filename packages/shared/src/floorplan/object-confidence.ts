import { z } from "zod";

/** Compact per-object confidence (additive on FloorPlanDocument entities). */
export const ObjectConfidenceSchema = z.object({
  score: z.number().min(0).max(1),
  source: z
    .enum(["vision", "ocr", "constraint", "manual", "seed", "unknown"])
    .default("unknown"),
  reason: z.string().optional(),
});

export type ObjectConfidence = z.infer<typeof ObjectConfidenceSchema>;
