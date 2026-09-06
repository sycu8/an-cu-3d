import { z } from "zod";
import { ObjectConfidenceSchema } from "./object-confidence.js";

export const JobState = z.enum([
  "DISCOVERED",
  "QUEUED",
  "CRAWLING",
  "INGESTED",
  "CLASSIFYING",
  "NORMALIZING",
  "ANALYZING",
  "EXTRACTING",
  "GEOMETRY_BUILDING",
  "VALIDATING",
  "REVIEW_PENDING",
  "APPROVED",
  "REJECTED",
  "PUBLISHING",
  "PUBLISHED",
  "FAILED",
]);

export const AssetClass = z.enum([
  "floorplan_raster",
  "floorplan_vector",
  "floorplan_pdf",
  "site_plan",
  "elevation",
  "render_3d",
  "brochure_page",
  "thumbnail",
  "unknown",
]);

export const SourceClass = z.enum([
  "official_developer",
  "official_broker",
  "marketing_pdf",
  "web_scrape",
  "manual_upload",
  "seed_estimated",
  "unknown",
]);

export const ReviewStatus = z.enum([
  "unreviewed",
  "in_review",
  "approved",
  "rejected",
  "published",
]);

export const Vec2Schema = z.tuple([z.number(), z.number()]);

export const ScaleCalibrationSchema = z.object({
  metersPerUnit: z.number().positive(),
  unit: z.literal("meter"),
  referenceLengthM: z.number().positive().optional(),
  referenceLengthPx: z.number().positive().optional(),
  method: z.enum(["dimension_label", "scale_bar", "known_room", "manual", "estimated"]),
  confidence: z.number().min(0).max(1),
  estimated: z.boolean(),
  notes: z.string().optional(),
});

export const ConfidenceResultSchema = z.object({
  overall: z.number().min(0).max(1),
  scale: z.number().min(0).max(1).optional(),
  walls: z.number().min(0).max(1).optional(),
  openings: z.number().min(0).max(1).optional(),
  rooms: z.number().min(0).max(1).optional(),
  fixtures: z.number().min(0).max(1).optional(),
  source: z.number().min(0).max(1).optional(),
  reviewStatus: ReviewStatus,
});

export const ValidationIssueSchema = z.object({
  code: z.string(),
  message: z.string(),
  severity: z.enum(["error", "warning", "info"]),
  entityIds: z.array(z.string()).optional(),
});

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(ValidationIssueSchema),
  warnings: z.array(ValidationIssueSchema),
  areaDeviationPercent: z.number().nonnegative().optional(),
  checkedAt: z.string().datetime().optional(),
});

export const FloorplanVerificationStatusSchema = z.enum([
  "verified",
  "partially_verified",
  "estimated",
  "illustrative",
  "unknown",
]);

export const FloorPlanSourceMetadataSchema = z.object({
  sourceClass: SourceClass,
  assetClass: AssetClass,
  projectSlug: z.string(),
  projectName: z.string().optional(),
  buildingId: z.string().optional(),
  unitTypeCode: z.string().optional(),
  bedroomLabel: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  sourceHash: z.string().optional(),
  crawledAt: z.string().datetime().optional(),
  provenanceNote: z.string().optional(),
  jobState: JobState.optional(),
  /** Visitor-facing verification of this geometry vs unit type. */
  verificationStatus: FloorplanVerificationStatusSchema.optional(),
});

export const WallSchema = z.object({
  id: z.string(),
  start: Vec2Schema,
  end: Vec2Schema,
  thicknessM: z.number().positive().default(0.15),
  heightM: z.number().positive().default(2.8),
  exterior: z.boolean().optional(),
  /** Defaulted wall height (not measured from source). */
  heightDefaulted: z.boolean().optional(),
  confidence: ObjectConfidenceSchema.optional(),
});

export const DoorSchema = z.object({
  id: z.string(),
  wallId: z.string(),
  offsetM: z.number().nonnegative(),
  widthM: z.number().positive(),
  heightM: z.number().positive().default(2.1),
  swing: z.enum(["left", "right", "sliding", "unknown"]).default("unknown"),
  connectsRoomIds: z.array(z.string()).optional(),
  confidence: ObjectConfidenceSchema.optional(),
});

export const WindowSchema = z.object({
  id: z.string(),
  wallId: z.string(),
  offsetM: z.number().nonnegative(),
  widthM: z.number().positive(),
  heightM: z.number().positive().default(1.2),
  sillHeightM: z.number().nonnegative().default(0.9),
  /** Optional head height when known from source. */
  headHeightM: z.number().positive().optional(),
  confidence: ObjectConfidenceSchema.optional(),
});

export const RoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([
    "living",
    "bedroom",
    "bathroom",
    "kitchen",
    "balcony",
    "corridor",
    "storage",
    "other",
  ]),
  polygon: z.array(Vec2Schema).min(3),
  areaSqM: z.number().positive().optional(),
  confidence: ObjectConfidenceSchema.optional(),
});

export const FixtureSchema = z.object({
  id: z.string(),
  type: z.enum(["toilet", "sink", "shower", "bathtub", "stove", "hood", "other"]),
  roomId: z.string(),
  position: Vec2Schema,
  rotationRad: z.number().default(0),
  sizeM: z.tuple([z.number().positive(), z.number().positive()]).optional(),
  confidence: ObjectConfidenceSchema.optional(),
});

export const FurnitureInstanceSchema = z.object({
  id: z.string(),
  catalogId: z.string(),
  roomId: z.string(),
  position: Vec2Schema,
  rotationRad: z.number().default(0),
  scale: z.number().positive().default(1),
  confidence: ObjectConfidenceSchema.optional(),
});

export const PublicationStateSchema = z.enum([
  "draft",
  "needs_review",
  "approved",
  "published",
]);

export const FloorPlanDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string(),
  label: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  coordinateUnit: z.literal("meter"),
  netAreaSqM: z.number().positive().optional(),
  bedroomCount: z.number().int().nonnegative().optional(),
  bathroomCount: z.number().nonnegative().optional(),
  source: FloorPlanSourceMetadataSchema,
  scale: ScaleCalibrationSchema,
  confidence: ConfidenceResultSchema,
  validation: ValidationResultSchema,
  walls: z.array(WallSchema).min(1),
  doors: z.array(DoorSchema),
  windows: z.array(WindowSchema),
  rooms: z.array(RoomSchema).min(1),
  fixtures: z.array(FixtureSchema),
  furniture: z.array(FurnitureInstanceSchema),
  notes: z.string().optional(),
  /** Publish lifecycle for visitor-facing geometry. */
  publicationState: PublicationStateSchema.optional(),
});

export function parseFloorPlanDocument(input: unknown) {
  return FloorPlanDocumentSchema.parse(input);
}

export function safeParseFloorPlanDocument(input: unknown) {
  return FloorPlanDocumentSchema.safeParse(input);
}
