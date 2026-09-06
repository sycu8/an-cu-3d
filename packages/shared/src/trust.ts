/**
 * Visitor-facing trust / verification semantics.
 * Translates internal sourceClass + verification into user-friendly Vietnamese.
 */

export const FloorplanVerificationStatus = [
  "verified",
  "partially_verified",
  "estimated",
  "illustrative",
  "unknown",
] as const;

export type FloorplanVerificationStatusType =
  (typeof FloorplanVerificationStatus)[number];

export const DataTrustState = [
  "verified",
  "estimated",
  "pending_verification",
  "illustrative",
  "unknown",
] as const;

export type DataTrustStateType = (typeof DataTrustState)[number];

/** Map project/apartment sourceClass strings → visitor trust state. */
export function sourceClassToTrustState(
  sourceClass: string | null | undefined,
): DataTrustStateType {
  if (!sourceClass) return "unknown";
  switch (sourceClass) {
    case "verified_public":
    case "official_developer":
    case "official_cdt":
    case "official_broker":
      return "verified";
    case "estimated":
    case "seed_estimated":
    case "marketing_pdf":
    case "web_scrape":
      return "estimated";
    case "pending_verification":
      return "pending_verification";
    case "illustrative":
      return "illustrative";
    default:
      return "unknown";
  }
}

export function floorplanVerificationLabel(
  status: FloorplanVerificationStatusType,
): string {
  switch (status) {
    case "verified":
      return "Đã xác minh mặt bằng";
    case "partially_verified":
      return "Xác minh một phần";
    case "estimated":
      return "Mô hình tham khảo";
    case "illustrative":
      return "Hình minh họa — không phải mặt bằng chính thức";
    case "unknown":
      return "Chưa có mặt bằng được xác minh";
  }
}

export function dataTrustLabel(state: DataTrustStateType): string {
  switch (state) {
    case "verified":
      return "Đã xác minh từ nguồn công khai";
    case "estimated":
      return "Dữ liệu tham khảo — cần xác minh trước giao dịch";
    case "pending_verification":
      return "Chưa đủ dữ liệu xác minh";
    case "illustrative":
      return "Hình minh họa — không phải dữ liệu chính thức";
    case "unknown":
      return "Chưa đủ dữ liệu xác minh";
  }
}

export function dataTrustShortLabel(state: DataTrustStateType): string {
  switch (state) {
    case "verified":
      return "Đã xác minh";
    case "estimated":
      return "Dữ liệu tham khảo";
    case "pending_verification":
      return "Chờ xác minh";
    case "illustrative":
      return "Minh họa";
    case "unknown":
      return "Chưa đủ dữ liệu";
  }
}

export interface DataTrustInfo {
  state: DataTrustStateType;
  label: string;
  shortLabel: string;
  sourceClass?: string;
  provenanceNote?: string;
  verifiedAt?: string;
  confidence?: number;
}

export function buildDataTrustInfo(input: {
  sourceClass?: string | null;
  provenance?: string | null;
  verifiedAt?: string | null;
  confidence?: number | null;
  /** Override when floorplan/media is illustrative even if project is verified. */
  forceState?: DataTrustStateType;
}): DataTrustInfo {
  const state = input.forceState ?? sourceClassToTrustState(input.sourceClass);
  return {
    state,
    label: dataTrustLabel(state),
    shortLabel: dataTrustShortLabel(state),
    sourceClass: input.sourceClass ?? undefined,
    provenanceNote: input.provenance?.trim() || undefined,
    verifiedAt: input.verifiedAt?.trim() || undefined,
    confidence:
      typeof input.confidence === "number" && Number.isFinite(input.confidence)
        ? input.confidence
        : undefined,
  };
}

/**
 * Resolve whether a FloorPlanDocument may be shown as the layout for a unit.
 * Mismatched bedroom counts must never silently render as verified.
 */
export function resolveFloorplanVerification(input: {
  requestedBedrooms?: number | null;
  documentBedroomCount?: number | null;
  documentSourceClass?: string | null;
  explicitStatus?: FloorplanVerificationStatusType | null;
  hasDocument: boolean;
}): FloorplanVerificationStatusType {
  if (input.explicitStatus) return input.explicitStatus;
  if (!input.hasDocument) return "unknown";

  const req = input.requestedBedrooms;
  const docBeds = input.documentBedroomCount;
  if (
    typeof req === "number" &&
    typeof docBeds === "number" &&
    Number.isFinite(req) &&
    Number.isFinite(docBeds) &&
    req !== docBeds
  ) {
    return "illustrative";
  }

  const trust = sourceClassToTrustState(input.documentSourceClass);
  if (trust === "verified") return "verified";
  if (trust === "estimated") return "estimated";
  if (input.documentSourceClass === "seed_estimated") return "illustrative";
  return "partially_verified";
}

/** True when measurements may be shown as precise (not "Ước lượng"). */
export function canShowPreciseMeasurements(input: {
  scaleConfidence?: number | null;
  scaleEstimated?: boolean | null;
  verificationStatus?: FloorplanVerificationStatusType | null;
}): boolean {
  if (
    input.verificationStatus === "illustrative" ||
    input.verificationStatus === "unknown" ||
    input.verificationStatus === "estimated"
  ) {
    return false;
  }
  if (input.scaleEstimated) return false;
  const conf = input.scaleConfidence;
  if (conf == null || !Number.isFinite(conf)) return false;
  return conf >= 0.8;
}
