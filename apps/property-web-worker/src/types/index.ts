/** Re-export shared domain types used by the web app. */
import type { ProjectMediaItem } from "@ancu/shared";

export type {
  FloorPlanDocument,
  Room,
  Wall,
  Door,
  Window,
  FurnitureInstance,
  Fixture,
  SourceClassType as SourceClass,
  ProjectMediaItem,
} from "@ancu/shared";

export type { AmenityCategory } from "./amenity";

export type ViewerMode = "dollhouse" | "top" | "perspective" | "walk";

export interface ProjectSummary {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  city?: string;
  district?: string;
  developerName: string;
  handover: string;
  priceRange: string;
  /** Provenance for priceRange when it is a secondary-market reference (never CĐT sheet). */
  priceProvenance?: string;
  totalUnits: string;
  latitude?: number;
  longitude?: number;
  sourceClass: string;
  provenance?: string;
  confidence?: number;
  /** D1/admin status when known */
  status?: string;
  updatedAt?: string;
  /** R2 object key for project cover (served via /api/media). */
  coverR2Key?: string;
  /** Public media URL when cover is stored in R2. */
  coverUrl?: string;
  showroom?: ProjectShowroomConfig;
  /** Min bedrooms across published unit types when known. */
  minBedrooms?: number;
  /** Max bedrooms across published unit types when known. */
  maxBedrooms?: number;
}

export interface ProjectShowroomConfig {
  lightingDefault?: string;
  materialPaletteLabel?: string;
  hotspots?: { roomHint: string; label: string; order: number }[];
  materialFromPhoto?: {
    floor: string;
    wall: string;
    cabinet: string;
    accent: string;
    notes?: string;
  };
}

export type FloorplanVerificationStatus =
  | "verified"
  | "partially_verified"
  | "estimated"
  | "illustrative"
  | "unknown";

export interface ApartmentTypeSummary {
  id: string;
  slug: string;
  name: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm: string;
  price: string;
  floorplanKey?: string;
  /** Explicit floorplan trust — never imply verified when illustrative/unknown. */
  floorplanVerification?: FloorplanVerificationStatus;
  sourceClass: string;
  provenance?: string;
  confidence?: number;
  validationSummary?: string;
  /** Last verification timestamp when known (ISO or display string). */
  verifiedAt?: string;
}

/** Legal / sales documents tracked per project (verified public only). */
export interface ProjectDocument {
  id: string;
  kind:
    | "legal_title"
    | "sales_contract"
    | "handover_minutes"
    | "brochure"
    | "floorplan"
    | "other";
  title: string;
  /** verified = cited public fact; pending = not yet confirmed; unavailable = known missing */
  status: "verified" | "pending" | "unavailable";
  issuedAt?: string;
  note?: string;
  sourceClass: string;
  provenance?: string;
}

/** Unit / tower handover inventory (public progress, not a sales quote). */
export interface HandoverUnitSummary {
  id: string;
  label: string;
  tower?: string;
  status: "handed_over" | "selling" | "upcoming" | "construction";
  handedOverAt?: string;
  note?: string;
  sourceClass: string;
  provenance?: string;
}

export interface ProjectDetail extends ProjectSummary {
  description?: string;
  address?: string;
  amenities: { category: string; name: string }[];
  apartmentTypes: ApartmentTypeSummary[];
  nearbyPlaces: NearbyPlace[];
  showroom?: ProjectShowroomConfig;
  /** 2D floorplans, perspectives, and related gallery items. */
  media?: ProjectMediaItem[];
  /** Public legal / brochure / handover document checklist. */
  documents?: ProjectDocument[];
  /** Handed-over or upcoming unit groups (towers / phases). */
  handoverUnits?: HandoverUnitSummary[];
}

export interface NearbyPlace {
  id: string;
  category: string;
  name: string;
  latitude?: number;
  longitude?: number;
  distanceKm: string;
  travelTime: string;
  sourceClass: string;
}
