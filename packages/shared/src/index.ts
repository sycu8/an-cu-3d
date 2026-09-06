/** Package entry — tokens, schema, geometry, R2 helpers, samples. */
export { BRAND, palette, tokens } from "./tokens.js";
export type { Palette, Tokens } from "./tokens.js";

export {
  FLOORPLAN_STAGES,
  R2_ROOT,
  SHARED_ASSET_KINDS,
  floorplanArtifactPath,
  floorplanStagePrefix,
  projectPath,
  projectPrefix,
  publishedFloorPlanDocumentKey,
  sharedAssetPath,
} from "./r2-paths.js";
export type { FloorplanStage, SharedAssetKind } from "./r2-paths.js";

export {
  AssetClass,
  ConfidenceResultSchema,
  DoorSchema,
  FixtureSchema,
  FloorPlanDocumentSchema,
  FloorPlanSourceMetadataSchema,
  FurnitureInstanceSchema,
  JobState,
  ReviewStatus,
  RoomSchema,
  ScaleCalibrationSchema,
  SourceClass,
  ValidationIssueSchema,
  ValidationResultSchema,
  Vec2Schema,
  WallSchema,
  WindowSchema,
  parseFloorPlanDocument,
  safeParseFloorPlanDocument,
} from "./floorplan/schema.js";

export type {
  AssetClass as AssetClassType,
  ConfidenceResult,
  Door,
  Fixture,
  FloorPlanDocument,
  FloorPlanSourceMetadata,
  FurnitureInstance,
  JobState as JobStateType,
  ReviewStatus as ReviewStatusType,
  Room,
  ScaleCalibration,
  SourceClass as SourceClassType,
  ValidationIssue,
  ValidationResult,
  Vec2,
  Wall,
  Window,
} from "./floorplan/types.js";

export {
  add,
  angle,
  distance,
  dot,
  length,
  midpoint,
  nearlyEqual,
  normalize,
  polygonArea,
  scale,
  sub,
  vec2,
} from "./geometry/vec2.js";

export { mergeCollinear, segmentLength, snapVertices } from "./geometry/walls.js";
export type { WallSegment } from "./geometry/walls.js";

export {
  areaDeviationPercent,
  checkAreaConsistency,
  checkRoomPolygons,
  checkWallSegments,
} from "./geometry/validation.js";
export type { TopologyCheckResult, TopologyIssue } from "./geometry/validation.js";

export { sampleFloorPlans } from "./floorplan/samples/index.js";
export type { SampleFloorPlanKey } from "./floorplan/samples/index.js";
