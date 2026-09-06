/**
 * Public (buyer-facing) project shaping.
 * Surface typology + trust labels; never pending placeholders as facts,
 * never secondary-market prices as CĐT list prices, never mismatched floorplans as verified.
 */

import type { FloorplanVerificationStatusType } from "@ancu/shared";
import {
  buildDataTrustInfo,
  dataTrustShortLabel,
  sourceClassToTrustState,
} from "@ancu/shared";
import type {
  ApartmentTypeSummary,
  FloorplanVerificationStatus,
  HandoverUnitSummary,
  NearbyPlace,
  ProjectDetail,
  ProjectDocument,
  ProjectSummary,
} from "../types";

export const PENDING_LABEL = "Chờ xác minh";

const VERIFIED_SOURCES = new Set([
  "verified_public",
  "official_developer",
  "official_cdt",
]);

export function isPendingValue(value: string | null | undefined): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  return trimmed === PENDING_LABEL || trimmed.startsWith("Chờ xác minh");
}

export function isSecondaryMarketPrice(value: string | null | undefined): boolean {
  if (!value) return false;
  return /thứ cấp|tham chiếu tt|không phải bảng giá/i.test(value);
}

export function isVerifiedSource(sourceClass: string | null | undefined): boolean {
  if (!sourceClass) return false;
  return VERIFIED_SOURCES.has(sourceClass);
}

/** Return the value only when it is a concrete, non-pending fact. */
export function verifiedText(value: string | null | undefined): string | undefined {
  if (isPendingValue(value)) return undefined;
  return value!.trim();
}

/** Buyer-facing price: verified official/list-style values only (no secondary refs). */
export function verifiedBuyerPrice(value: string | null | undefined): string | undefined {
  const text = verifiedText(value);
  if (!text) return undefined;
  if (isSecondaryMarketPrice(text)) return undefined;
  return text;
}

function resolveApartmentFloorplanVerification(
  apt: ApartmentTypeSummary,
): FloorplanVerificationStatus {
  if (apt.floorplanVerification) return apt.floorplanVerification;
  if (!apt.floorplanKey) return "unknown";
  // Seed keys from other projects are illustrative until a project-specific doc is published.
  if (apt.sourceClass === "estimated" || apt.sourceClass === "seed_estimated") {
    return "illustrative";
  }
  if (isVerifiedSource(apt.sourceClass)) return "verified";
  return "unknown";
}

/**
 * Keep typology for browsing; strip unverified area/price.
 * Attach floorplanVerification so UI never implies a verified layout.
 */
function mapPublicApartment(apt: ApartmentTypeSummary): ApartmentTypeSummary {
  const areaSqm = verifiedText(apt.areaSqm);
  const price = verifiedBuyerPrice(apt.price);
  const floorplanVerification = resolveApartmentFloorplanVerification(apt);
  const trust = buildDataTrustInfo({
    sourceClass: apt.sourceClass,
    provenance: apt.provenance,
    confidence: apt.confidence,
    forceState:
      floorplanVerification === "illustrative"
        ? "illustrative"
        : floorplanVerification === "unknown"
          ? "unknown"
          : undefined,
  });

  return {
    id: apt.id,
    slug: apt.slug,
    name: apt.name,
    bedrooms: apt.bedrooms,
    bathrooms: apt.bathrooms,
    areaSqm: areaSqm ?? "",
    price: price ?? "",
    // Only expose floorplanKey when not unknown — unknown means no safe geometry.
    floorplanKey: floorplanVerification === "unknown" ? undefined : apt.floorplanKey,
    floorplanVerification,
    sourceClass: apt.sourceClass,
    // Visitor-friendly note only (not raw engineering confidence).
    provenance: trust.label,
    verifiedAt: apt.verifiedAt,
  };
}

function mapVerifiedDocument(doc: ProjectDocument): ProjectDocument | null {
  if (doc.status !== "verified") return null;
  if (!isVerifiedSource(doc.sourceClass)) return null;
  return {
    id: doc.id,
    kind: doc.kind,
    title: doc.title,
    status: doc.status,
    issuedAt: doc.issuedAt,
    note: doc.note,
    sourceClass: doc.sourceClass,
  };
}

function mapVerifiedHandoverUnit(unit: HandoverUnitSummary): HandoverUnitSummary | null {
  if (!isVerifiedSource(unit.sourceClass)) return null;
  return {
    id: unit.id,
    label: unit.label,
    tower: unit.tower,
    status: unit.status,
    handedOverAt: unit.handedOverAt,
    note: unit.note,
    sourceClass: unit.sourceClass,
  };
}

function mapVerifiedNearby(place: NearbyPlace): NearbyPlace | null {
  if (!isVerifiedSource(place.sourceClass)) return null;
  const distanceKm = verifiedText(place.distanceKm);
  const travelTime = verifiedText(place.travelTime);
  // Keep POI identity when verified even without distance — location intelligence can use coords.
  if (!distanceKm && !travelTime && place.latitude == null && place.longitude == null) {
    return null;
  }
  return {
    id: place.id,
    category: place.category,
    name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    distanceKm: distanceKm ?? "",
    travelTime: travelTime ?? "",
    sourceClass: place.sourceClass,
  };
}

export function projectTrustShortLabel(project: ProjectSummary): string {
  const state = sourceClassToTrustState(project.sourceClass);
  return dataTrustShortLabel(state);
}

/** Strip unverified fields from list cards / compare rows. */
export function toPublicSummary(project: ProjectSummary): ProjectSummary {
  const trust = buildDataTrustInfo({
    sourceClass: project.sourceClass,
    provenance: project.provenance,
  });
  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    tagline: project.tagline,
    city: project.city,
    district: project.district,
    developerName: project.developerName,
    handover: verifiedText(project.handover) ?? "",
    priceRange: verifiedBuyerPrice(project.priceRange) ?? "",
    totalUnits: verifiedText(project.totalUnits) ?? "",
    latitude: project.latitude,
    longitude: project.longitude,
    sourceClass: isVerifiedSource(project.sourceClass)
      ? project.sourceClass
      : project.sourceClass || "estimated",
    // Friendly trust label for UI (not raw research notes).
    provenance: trust.label,
    status: project.status,
    updatedAt: project.updatedAt,
    coverR2Key: project.coverR2Key,
    coverUrl: project.coverUrl,
    showroom: project.showroom,
    minBedrooms: project.minBedrooms,
    maxBedrooms: project.maxBedrooms,
    // Intentionally omit: confidence, priceProvenance
  };
}

/** Strip pending / secondary noise; keep typology + trust for apartment exploration. */
export function toPublicDetail(project: ProjectDetail): ProjectDetail {
  const summary = toPublicSummary(project);
  const apartmentTypes = (project.apartmentTypes ?? []).map(mapPublicApartment);

  const documents = (project.documents ?? [])
    .map(mapVerifiedDocument)
    .filter((d): d is ProjectDocument => Boolean(d));

  const handoverUnits = (project.handoverUnits ?? [])
    .map(mapVerifiedHandoverUnit)
    .filter((u): u is HandoverUnitSummary => Boolean(u));

  const nearbyPlaces = (project.nearbyPlaces ?? [])
    .map(mapVerifiedNearby)
    .filter((p): p is NearbyPlace => Boolean(p));

  return {
    ...summary,
    description: project.description,
    address: verifiedText(project.address),
    amenities: project.amenities ?? [],
    apartmentTypes,
    nearbyPlaces,
    showroom: project.showroom,
    media: project.media,
    documents: documents.length ? documents : undefined,
    handoverUnits: handoverUnits.length ? handoverUnits : undefined,
  };
}

export type { FloorplanVerificationStatusType };
