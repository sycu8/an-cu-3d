import type { z } from "zod";
import {
  AssetClass,
  ConfidenceResultSchema,
  DoorSchema,
  FixtureSchema,
  FloorPlanDocumentSchema,
  FloorPlanSourceMetadataSchema,
  FloorplanVerificationStatusSchema,
  FurnitureInstanceSchema,
  JobState,
  PublicationStateSchema,
  ReviewStatus,
  RoomSchema,
  ScaleCalibrationSchema,
  SourceClass,
  ValidationIssueSchema,
  ValidationResultSchema,
  Vec2Schema,
  WallSchema,
  WindowSchema,
} from "./schema.js";
import { ObjectConfidenceSchema } from "./object-confidence.js";

export type Vec2 = z.infer<typeof Vec2Schema>;
export type JobStateType = z.infer<typeof JobState>;
export type AssetClassType = z.infer<typeof AssetClass>;
export type SourceClassType = z.infer<typeof SourceClass>;
export type ReviewStatusType = z.infer<typeof ReviewStatus>;
export type ScaleCalibration = z.infer<typeof ScaleCalibrationSchema>;
export type ConfidenceResult = z.infer<typeof ConfidenceResultSchema>;
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type FloorPlanSourceMetadata = z.infer<typeof FloorPlanSourceMetadataSchema>;
export type FloorplanVerificationStatus = z.infer<typeof FloorplanVerificationStatusSchema>;
export type PublicationState = z.infer<typeof PublicationStateSchema>;
export type ObjectConfidence = z.infer<typeof ObjectConfidenceSchema>;
export type Wall = z.infer<typeof WallSchema>;
export type Door = z.infer<typeof DoorSchema>;
export type Window = z.infer<typeof WindowSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type Fixture = z.infer<typeof FixtureSchema>;
export type FurnitureInstance = z.infer<typeof FurnitureInstanceSchema>;
export type FloorPlanDocument = z.infer<typeof FloorPlanDocumentSchema>;
