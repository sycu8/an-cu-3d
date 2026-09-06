import type { ProjectDetail, ProjectSummary } from "../types";
import { DEMO_SCALE_PROJECTS } from "./demo-scale-projects";

const PENDING = "Chờ xác minh";

export const GAMUDA_DEVELOPER = {
  id: "dev_gamuda_land",
  slug: "gamuda-land",
  name: "Gamuda Land",
  website: "https://www.gamudaland.com.vn",
  sourceClass: "verified_public" as const,
  provenance: "Public developer website and press releases",
};

export const GAMUDA_PROJECTS: ProjectDetail[] = [
  {
    id: "proj_eaton_park",
    slug: "eaton-park",
    name: "Eaton Park",
    tagline: "Khu đô thị tích hợp tại TP. Thủ Đức",
    description:
      "Dự án khu đô thị tích hợp của Gamuda Land tại khu vực TP. Thủ Đức, TP. Hồ Chí Minh. Thông tin chi tiết đang được xác minh từ nguồn chính thống.",
    city: "TP. Hồ Chí Minh",
    district: "TP. Thủ Đức",
    address: PENDING,
    developerName: GAMUDA_DEVELOPER.name,
    handover: PENDING,
    priceRange: PENDING,
    totalUnits: PENDING,
    latitude: 10.8411,
    longitude: 106.8098,
    sourceClass: "verified_public",
    provenance: "Gamuda Land public project listings; coordinates approximate district center",
    confidence: 0.6,
    amenities: [
      { category: "park", name: "Công viên nội khu (theo thiết kế)" },
      { category: "shopping", name: "Tiện ích thương mại (theo thiết kế)" },
    ],
    apartmentTypes: [
      {
        id: "apt_eaton_studio",
        slug: "studio-a",
        name: "Studio A",
        bedrooms: 0,
        bathrooms: 1,
        areaSqm: PENDING,
        price: PENDING,
        sourceClass: "estimated",
        provenance: "Floor plan pending publication",
        confidence: 0.3,
        validationSummary: "Awaiting published FloorPlanDocument",
      },
      {
        id: "apt_eaton_1br",
        slug: "1br-b",
        name: "1 Bedroom B",
        bedrooms: 1,
        bathrooms: 1,
        areaSqm: PENDING,
        price: PENDING,
        sourceClass: "estimated",
        provenance: "Floor plan pending publication",
        confidence: 0.3,
        validationSummary: "Awaiting published FloorPlanDocument",
      },
      {
        id: "apt_eaton_2br",
        slug: "2br-c",
        name: "2 Bedroom C",
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: PENDING,
        price: PENDING,
        sourceClass: "estimated",
        provenance: "Floor plan pending publication",
        confidence: 0.3,
        validationSummary: "Awaiting published FloorPlanDocument",
      },
    ],
    nearbyPlaces: [
      {
        id: "near_eaton_metro",
        category: "transport",
        name: "Ga metro (khu vực Thủ Đức)",
        distanceKm: PENDING,
        travelTime: PENDING,
        sourceClass: "estimated",
      },
    ],
  },
  {
    id: "proj_elysian",
    slug: "elysian",
    name: "Elysian",
    tagline: "Căn hộ cao cấp Gamuda Land tại TP. Thủ Đức",
    description:
      "Dự án căn hộ của Gamuda Land tại khu vực TP. Thủ Đức. Chi tiết giá, quy mô và bàn giao đang chờ xác minh.",
    city: "TP. Hồ Chí Minh",
    district: "TP. Thủ Đức",
    address: PENDING,
    developerName: GAMUDA_DEVELOPER.name,
    handover: PENDING,
    priceRange: PENDING,
    totalUnits: PENDING,
    latitude: 10.835,
    longitude: 106.815,
    sourceClass: "verified_public",
    provenance: "Gamuda Land public announcements; coordinates approximate",
    confidence: 0.55,
    amenities: [
      { category: "park", name: "Không gian xanh nội khu" },
      { category: "restaurant", name: "Khu ẩm thực (theo thiết kế)" },
    ],
    apartmentTypes: [
      {
        id: "apt_elysian_studio",
        slug: "studio",
        name: "Studio",
        bedrooms: 0,
        bathrooms: 1,
        areaSqm: PENDING,
        price: PENDING,
        sourceClass: "estimated",
        provenance: "Floor plan pending publication",
        confidence: 0.3,
        validationSummary: "Awaiting published FloorPlanDocument",
      },
      {
        id: "apt_elysian_2br",
        slug: "2br",
        name: "2 Bedroom",
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: PENDING,
        price: PENDING,
        sourceClass: "estimated",
        provenance: "Floor plan pending publication",
        confidence: 0.3,
        validationSummary: "Awaiting published FloorPlanDocument",
      },
    ],
    nearbyPlaces: [
      {
        id: "near_elysian_school",
        category: "education",
        name: "Trường học khu vực Thủ Đức",
        distanceKm: PENDING,
        travelTime: PENDING,
        sourceClass: "estimated",
      },
    ],
  },
  {
    id: "proj_celadon_city",
    slug: "celadon-city",
    name: "Celadon City",
    tagline: "Khu đô thị tích hợp quy mô lớn tại Tân Phú",
    description:
      "Celadon City là khu đô thị tích hợp của Gamuda Land tại quận Tân Phú, TP. Hồ Chí Minh — một trong những dự án lớn của nhà phát triển tại thành phố.",
    city: "TP. Hồ Chí Minh",
    district: "Tân Phú",
    address: "Đường N1, Khu đô thị Celadon City, Tân Phú",
    developerName: GAMUDA_DEVELOPER.name,
    handover: PENDING,
    priceRange: PENDING,
    totalUnits: PENDING,
    latitude: 10.8012,
    longitude: 106.6188,
    sourceClass: "verified_public",
    provenance: "Gamuda Land official project page; publicly known Tân Phú location",
    confidence: 0.75,
    amenities: [
      { category: "park", name: "Công viên 16.5 ha Aeon Mall Celadon" },
      { category: "shopping", name: "Aeon Mall Celadon Tan Phu" },
      { category: "education", name: "Trường quốc tế trong khu đô thị" },
    ],
    apartmentTypes: [
      {
        id: "apt_celadon_studio",
        slug: "studio-s",
        name: "Studio S",
        bedrooms: 0,
        bathrooms: 1,
        areaSqm: PENDING,
        price: PENDING,
        sourceClass: "estimated",
        provenance: "Floor plan pending publication",
        confidence: 0.35,
        validationSummary: "Awaiting published FloorPlanDocument",
      },
      {
        id: "apt_celadon_1br",
        slug: "1br-m",
        name: "1 Bedroom M",
        bedrooms: 1,
        bathrooms: 1,
        areaSqm: PENDING,
        price: PENDING,
        sourceClass: "estimated",
        provenance: "Floor plan pending publication",
        confidence: 0.35,
        validationSummary: "Awaiting published FloorPlanDocument",
      },
      {
        id: "apt_celadon_3br",
        slug: "3br-l",
        name: "3 Bedroom L",
        bedrooms: 3,
        bathrooms: 2,
        areaSqm: PENDING,
        price: PENDING,
        sourceClass: "estimated",
        provenance: "Floor plan pending publication",
        confidence: 0.35,
        validationSummary: "Awaiting published FloorPlanDocument",
      },
    ],
    nearbyPlaces: [
      {
        id: "near_celadon_aeon",
        category: "shopping",
        name: "Aeon Mall Celadon Tan Phu",
        latitude: 10.8015,
        longitude: 106.6195,
        distanceKm: "~0.5",
        travelTime: PENDING,
        sourceClass: "verified_public",
      },
      {
        id: "near_celadon_airport",
        category: "airport",
        name: "Sân bay Tân Sơn Nhất",
        distanceKm: PENDING,
        travelTime: PENDING,
        sourceClass: "estimated",
      },
    ],
  },
];

/** Seed + sanitized demo inventory for production-like local density. */
export const ALL_SEED_PROJECTS: ProjectDetail[] = [
  ...GAMUDA_PROJECTS,
  ...DEMO_SCALE_PROJECTS,
];

export function getProjectSummaries(): ProjectSummary[] {
  return ALL_SEED_PROJECTS.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline,
    city: p.city,
    district: p.district,
    developerName: p.developerName,
    handover: p.handover,
    priceRange: p.priceRange,
    totalUnits: p.totalUnits,
    latitude: p.latitude,
    longitude: p.longitude,
    sourceClass: p.sourceClass,
    provenance: p.provenance,
    confidence: p.confidence,
    status: "published",
  }));
}

export function getProjectBySlug(slug: string): ProjectDetail | undefined {
  return ALL_SEED_PROJECTS.find((p) => p.slug === slug);
}

export function getAllNearbyPlaces() {
  return ALL_SEED_PROJECTS.flatMap((p) =>
    p.nearbyPlaces.map((place) => ({
      ...place,
      projectSlug: p.slug,
      projectName: p.name,
      projectLat: p.latitude,
      projectLng: p.longitude,
    })),
  );
}
