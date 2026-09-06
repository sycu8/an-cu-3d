/** Package entry — tokens, schema, geometry, R2 helpers, samples, AI, blog, showroom. */
export { BRAND, TAGLINE, palette, tokens } from "./tokens.js";
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
  AssetClassType,
  ConfidenceResult,
  Door,
  Fixture,
  FloorPlanDocument,
  FloorPlanSourceMetadata,
  FurnitureInstance,
  JobStateType,
  ReviewStatusType,
  Room,
  ScaleCalibration,
  SourceClassType,
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

export {
  DEFAULT_MODELS,
  chatViaGateway,
  chatViaWorkersAi,
  gatewayChatUrl,
  gatewayOpenAiUrl,
  parseJsonFromLlm,
} from "./ai-gateway.js";
export type {
  AiGatewayConfig,
  AiUseCase,
  ChatMessage,
  ChatResult,
} from "./ai-gateway.js";

export {
  PROJECT_BUILD_STAGES,
  slugifyProjectName,
} from "./project-build.js";
export type {
  ProjectBuildEvent,
  ProjectBuildJob,
  ProjectBuildJobStatus,
  ProjectBuildStage,
} from "./project-build.js";

export type { BlogMedia, BlogPost, BlogPostStatus } from "./blog.js";

export {
  DEFAULT_MATERIAL_PALETTES,
  LIGHTING_PRESETS,
} from "./showroom.js";
export type {
  LightingPreset,
  MaterialPalette,
  RoomHotspot,
} from "./showroom.js";
