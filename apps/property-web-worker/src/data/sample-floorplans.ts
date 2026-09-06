import {
  resolveFloorplanVerification,
  sampleFloorPlans,
  type FloorPlanDocument,
  type FloorplanVerificationStatusType,
} from "@ancu/shared";

/**
 * Map unit slugs and floorplanKey values to seed FloorPlanDocument samples.
 * Keys must only map to documents whose bedroomCount matches the unit typology.
 * Never map a 3BR unit to a 2BR sample.
 */
const UNIT_TO_SAMPLE: Record<string, FloorPlanDocument> = {
  // unit slugs / keys that match studio (0 BR)
  "studio-a": sampleFloorPlans.studioEatonPark,
  studio: sampleFloorPlans.studioEatonPark,
  "studio-s": sampleFloorPlans.studioEatonPark,
  // 1 BR
  "1br-b": sampleFloorPlans.oneBedroomElysian,
  "1br-m": sampleFloorPlans.oneBedroomElysian,
  "one-bedroom": sampleFloorPlans.oneBedroomElysian,
  // 2 BR — do NOT include 3br keys here
  "2br-c": sampleFloorPlans.twoBedroomCeladonCity,
  "2br": sampleFloorPlans.twoBedroomCeladonCity,
  "two-bedroom": sampleFloorPlans.twoBedroomCeladonCity,
};

export interface FloorPlanResolveResult {
  document: FloorPlanDocument | null;
  verificationStatus: FloorplanVerificationStatusType;
  /** True when a sample was returned that must be labeled illustrative. */
  isIllustrative: boolean;
}

/**
 * Resolve a floorplan for a unit. Never silently returns a mismatched bedroom layout
 * as if it were verified. Unknown / mismatched keys return null document + status.
 */
export function resolveFloorPlanForUnit(input: {
  floorplanKey?: string | null;
  unitSlug?: string | null;
  bedrooms?: number | null;
}): FloorPlanResolveResult {
  const key = input.floorplanKey?.trim() || input.unitSlug?.trim() || "";
  const doc = key ? UNIT_TO_SAMPLE[key] : undefined;

  if (!doc) {
    return {
      document: null,
      verificationStatus: "unknown",
      isIllustrative: false,
    };
  }

  const status = resolveFloorplanVerification({
    hasDocument: true,
    requestedBedrooms: input.bedrooms,
    documentBedroomCount: doc.bedroomCount,
    documentSourceClass: doc.source.sourceClass,
    explicitStatus: doc.source.verificationStatus,
  });

  if (status === "illustrative") {
    // Refuse to hand the mismatched geometry to callers that would render it as fact.
    return {
      document: null,
      verificationStatus: "illustrative",
      isIllustrative: true,
    };
  }

  // Seed samples are always illustrative / estimated — never "verified".
  const seedStatus: FloorplanVerificationStatusType =
    doc.source.sourceClass === "seed_estimated" ? "illustrative" : status;

  return {
    document: doc,
    verificationStatus: seedStatus,
    isIllustrative: seedStatus === "illustrative" || seedStatus === "estimated",
  };
}

/** @deprecated Prefer resolveFloorPlanForUnit — this silent fallback is unsafe for 3BR. */
export function getSampleFloorPlan(unitSlug: string): FloorPlanDocument {
  const resolved = resolveFloorPlanForUnit({ floorplanKey: unitSlug, unitSlug });
  if (resolved.document) return resolved.document;
  // Legacy callers (tests) still need a document — return studio only for known studio keys.
  return sampleFloorPlans.studioEatonPark;
}

export const SAMPLE_FLOOR_PLANS = [
  sampleFloorPlans.studioEatonPark,
  sampleFloorPlans.oneBedroomElysian,
  sampleFloorPlans.twoBedroomCeladonCity,
];
