/**
 * Reusable furniture metadata — metric dimensions + clearance.
 * Deterministic fit analysis consumes these definitions (not LLM).
 */

export type FurnitureCategory =
  | "bed"
  | "sofa"
  | "table"
  | "desk"
  | "wardrobe"
  | "chair"
  | "other";

export interface FurnitureDefinition {
  id: string;
  category: FurnitureCategory;
  label: string;
  /** Footprint width × depth in metres */
  dimensionsM: { width: number; depth: number; height: number };
  /** Minimum circulation clearance around furniture (m) */
  clearanceM: number;
  /** Preferred room types */
  roomTypes?: Array<
    "living" | "bedroom" | "bathroom" | "kitchen" | "balcony" | "corridor" | "storage" | "other"
  >;
}

export const FURNITURE_DEFINITIONS: Record<string, FurnitureDefinition> = {
  "bed-queen": {
    id: "bed-queen",
    category: "bed",
    label: "Giường queen 1.6×2.0",
    dimensionsM: { width: 1.6, depth: 2.0, height: 0.55 },
    clearanceM: 0.6,
    roomTypes: ["bedroom"],
  },
  "bed-king": {
    id: "bed-king",
    category: "bed",
    label: "Giường king 1.8×2.0",
    dimensionsM: { width: 1.8, depth: 2.0, height: 0.55 },
    clearanceM: 0.6,
    roomTypes: ["bedroom"],
  },
  "sofa-2seat": {
    id: "sofa-2seat",
    category: "sofa",
    label: "Sofa 2 chỗ 1.5×0.85",
    dimensionsM: { width: 1.5, depth: 0.85, height: 0.85 },
    clearanceM: 0.7,
    roomTypes: ["living"],
  },
  "sofa-3seat": {
    id: "sofa-3seat",
    category: "sofa",
    label: "Sofa 3 chỗ 2.1×0.9",
    dimensionsM: { width: 2.1, depth: 0.9, height: 0.85 },
    clearanceM: 0.8,
    roomTypes: ["living"],
  },
  "sofa-l": {
    id: "sofa-l",
    category: "sofa",
    label: "Sofa chữ L 2.4×1.8",
    dimensionsM: { width: 2.4, depth: 1.8, height: 0.85 },
    clearanceM: 0.8,
    roomTypes: ["living"],
  },
  "table-4seat": {
    id: "table-4seat",
    category: "table",
    label: "Bàn ăn 4 chỗ 1.2×0.8",
    dimensionsM: { width: 1.2, depth: 0.8, height: 0.75 },
    clearanceM: 0.7,
    roomTypes: ["living", "kitchen"],
  },
  "table-6seat": {
    id: "table-6seat",
    category: "table",
    label: "Bàn ăn 6 chỗ 1.6×0.9",
    dimensionsM: { width: 1.6, depth: 0.9, height: 0.75 },
    clearanceM: 0.75,
    roomTypes: ["living"],
  },
  desk: {
    id: "desk",
    category: "desk",
    label: "Bàn làm việc 1.2×0.6",
    dimensionsM: { width: 1.2, depth: 0.6, height: 0.75 },
    clearanceM: 0.7,
    roomTypes: ["bedroom", "other"],
  },
  wardrobe: {
    id: "wardrobe",
    category: "wardrobe",
    label: "Tủ quần áo 1.8×0.6",
    dimensionsM: { width: 1.8, depth: 0.6, height: 2.1 },
    clearanceM: 0.6,
    roomTypes: ["bedroom"],
  },
};

export function getFurnitureDefinition(id: string): FurnitureDefinition | undefined {
  return FURNITURE_DEFINITIONS[id];
}
