/** Package entry — tokens, schema, geometry, R2 helpers, samples, AI, blog, showroom, trust. */
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
  parseFloorPlanDocument,
  safeParseFloorPlanDocument,
} from "./floorplan/schema.js";

export { ObjectConfidenceSchema } from "./floorplan/object-confidence.js";
export type { ObjectConfidence } from "./floorplan/object-confidence.js";

export {
  CONFIDENCE_THRESHOLDS,
  OBJECT_SEVERITY,
  dispositionForConfidence,
  documentNeedsHumanReview,
} from "./floorplan/thresholds.js";
export type { ObjectSeverity, ReviewDisposition } from "./floorplan/thresholds.js";

export type {
  AssetClassType,
  ConfidenceResult,
  Door,
  Fixture,
  FloorPlanDocument,
  FloorPlanSourceMetadata,
  FloorplanVerificationStatus as FloorplanVerificationStatusField,
  FurnitureInstance,
  JobStateType,
  PublicationState,
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
  validateFloorPlanTopology,
} from "./geometry/validation.js";
export type { TopologyCheckResult, TopologyIssue } from "./geometry/validation.js";

export {
  checkDuplicateWalls,
  checkOpeningAttachment,
  checkRoomSelfIntersection,
  checkZeroAreaRooms,
  constrainWallNetwork,
} from "./geometry/constraints.js";

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

export {
  PROJECT_MEDIA_KINDS,
  UNIT_VIEW_MODES,
  UNIT_VIEW_MODE_LABELS,
  filterProjectMedia,
  isUnitViewMode,
} from "./project-media.js";
export type {
  ProjectMediaItem,
  ProjectMediaKind,
  UnitViewMode,
} from "./project-media.js";

export {
  FloorplanVerificationStatus,
  DataTrustState,
  sourceClassToTrustState,
  floorplanVerificationLabel,
  dataTrustLabel,
  dataTrustShortLabel,
  buildDataTrustInfo,
  resolveFloorplanVerification,
  canShowPreciseMeasurements,
} from "./trust.js";
export type {
  FloorplanVerificationStatusType,
  DataTrustStateType,
  DataTrustInfo,
} from "./trust.js";

export {
  FURNITURE_DEFINITIONS,
  getFurnitureDefinition,
} from "./furniture/definitions.js";
export type { FurnitureCategory, FurnitureDefinition } from "./furniture/definitions.js";

export {
  evaluateFurnitureFit,
  evaluateCommonBedroomFits,
  evaluateCommonLivingFits,
} from "./furniture/fit.js";
export type { FurnitureFitResult, FurnitureFitVerdict } from "./furniture/fit.js";

export { computeSpatialMetrics, computeSpaceScore } from "./spatial/metrics.js";
export type {
  RoomAreaMetric,
  SpatialMetrics,
  SpaceScoreBreakdown,
} from "./spatial/metrics.js";

export {
  DistanceOnlyRoutingProvider,
  getRoute,
  getRoutingProvider,
  haversineKm,
  setRoutingProvider,
} from "./routing.js";
export type {
  RouteRequest,
  RouteResult,
  RoutingProvider,
  TravelMode,
} from "./routing.js";

export {
  DEFAULT_LIFESTYLE,
  DEFAULT_WEIGHTS,
  PREFERENCE_KEYS,
  PREFERENCE_LABELS_VI,
  normalizeWeights,
  preferredBedrooms,
  scoreWeightedDecision,
} from "./decision/preferences.js";
export type {
  DecisionWeights,
  DimensionScore,
  HouseholdProfile,
  LifestylePreferences,
  MetricScoreInput,
  PreferenceKey,
  VehiclePreference,
  WeightedDecisionResult,
  WfhCount,
} from "./decision/preferences.js";

export { assessUnitFit } from "./decision/fit.js";
export type {
  FitComponent,
  FitComponentKey,
  UnitFitAssessment,
  UnitFitInput,
} from "./decision/fit.js";

export {
  buildRelativeMetrics,
  parsePriceMidTrieu,
  rankProjects,
} from "./decision/rank.js";
export type {
  ProjectScoreCandidate,
  RankedProject,
} from "./decision/rank.js";
