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
  MEDIA_API_PREFIX,
  MEDIA_VARIANTS,
  isSafeR2Key,
  mediaUrl,
  normalizeR2Key,
  resolveCoverUrl,
} from "./media.js";
export type { MediaUrlOptions, MediaVariant } from "./media.js";

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
  imageViaGateway,
  factualQaViaGateway,
} from "./ai-gateway.js";
export type {
  AiGatewayConfig,
  AiUseCase,
  ChatMessage,
  ChatResult,
  ImageResult,
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
  ProjectShowroomConfig,
} from "./showroom.js";
