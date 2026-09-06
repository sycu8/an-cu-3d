/**
 * Public (buyer-facing) project shaping.
 * Only surface facts that passed backend verification — never pending placeholders,
 * secondary-market research labels, or internal provenance/confidence noise.
 */

import type {
  ApartmentTypeSummary,
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

function mapVerifiedApartment(apt: ApartmentTypeSummary): ApartmentTypeSummary | null {
  if (!isVerifiedSource(apt.sourceClass) && isPendingValue(apt.areaSqm) && isPendingValue(apt.price)) {
    // Keep typology identity for browsing when source is verified at project level —
    // but drop completely estimated shells with nothing useful.
    if (apt.sourceClass === "estimated") return null;
  }

  const areaSqm = verifiedText(apt.areaSqm);
  const price = verifiedBuyerPrice(apt.price);

  return {
    id: apt.id,
    slug: apt.slug,
    name: apt.name,
    bedrooms: apt.bedrooms,
    bathrooms: apt.bathrooms,
    areaSqm: areaSqm ?? "",
    price: price ?? "",
    floorplanKey: apt.floorplanKey,
    sourceClass: apt.sourceClass,
    // Strip research metadata from public payload
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
  if (!distanceKm && !travelTime) return null;
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

/** Strip unverified fields from list cards / compare rows. */
export function toPublicSummary(project: ProjectSummary): ProjectSummary {
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
      : "verified_public",
    status: project.status,
    updatedAt: project.updatedAt,
    coverR2Key: project.coverR2Key,
    coverUrl: project.coverUrl,
    showroom: project.showroom,
    // Intentionally omit: confidence, provenance, priceProvenance
  };
}

/** Strip pending / secondary / provenance noise from project detail for buyers. */
export function toPublicDetail(project: ProjectDetail): ProjectDetail {
  const summary = toPublicSummary(project);
  const apartmentTypes = (project.apartmentTypes ?? [])
    .map(mapVerifiedApartment)
    .filter((a): a is ApartmentTypeSummary => Boolean(a));

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
