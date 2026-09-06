import type { z } from "zod";
import {
  AssetClass as AssetClassSchema,
  ConfidenceResultSchema,
  DoorSchema,
  FixtureSchema,
  FloorPlanDocumentSchema,
  FloorPlanSourceMetadataSchema,
  FurnitureInstanceSchema,
  JobState as JobStateSchema,
  ReviewStatus as ReviewStatusSchema,
  RoomSchema,
  ScaleCalibrationSchema,
  SourceClass as SourceClassSchema,
  ValidationIssueSchema,
  ValidationResultSchema,
  Vec2Schema,
  WallSchema,
  WindowSchema,
} from "./schema.js";

export type Vec2 = z.infer<typeof Vec2Schema>;
export type JobState = z.infer<typeof JobStateSchema>;
export type AssetClass = z.infer<typeof AssetClassSchema>;
export type SourceClass = z.infer<typeof SourceClassSchema>;
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;
export type ScaleCalibration = z.infer<typeof ScaleCalibrationSchema>;
export type ConfidenceResult = z.infer<typeof ConfidenceResultSchema>;
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type FloorPlanSourceMetadata = z.infer<typeof FloorPlanSourceMetadataSchema>;
export type Wall = z.infer<typeof WallSchema>;
export type Door = z.infer<typeof DoorSchema>;
export type Window = z.infer<typeof WindowSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type Fixture = z.infer<typeof FixtureSchema>;
export type FurnitureInstance = z.infer<typeof FurnitureInstanceSchema>;
export type FloorPlanDocument = z.infer<typeof FloorPlanDocumentSchema>;
