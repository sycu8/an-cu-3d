/** Re-export shared domain types used by the web app. */
export type {
  FloorPlanDocument,
  Room,
  Wall,
  Door,
  Window,
  FurnitureInstance,
  Fixture,
  SourceClassType as SourceClass,
} from "@ancu/shared";

export type { AmenityCategory } from "./amenity";

export type ViewerMode = "dollhouse" | "top" | "perspective";

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
  totalUnits: string;
  latitude?: number;
  longitude?: number;
  sourceClass: string;
  provenance?: string;
  confidence?: number;
  /** D1/admin status when known */
  status?: string;
  updatedAt?: string;
  showroom?: ProjectShowroomConfig;
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

export interface ApartmentTypeSummary {
  id: string;
  slug: string;
  name: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm: string;
  price: string;
  floorplanKey?: string;
  sourceClass: string;
  provenance?: string;
  confidence?: number;
  validationSummary?: string;
}

export interface ProjectDetail extends ProjectSummary {
  description?: string;
  address?: string;
  amenities: { category: string; name: string }[];
  apartmentTypes: ApartmentTypeSummary[];
  nearbyPlaces: NearbyPlace[];
  showroom?: ProjectShowroomConfig;
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
