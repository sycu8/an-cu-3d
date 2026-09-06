/**
 * Procedural 3D furniture icons inspired by RealEstateOS staging vocabulary
 * (modern / scandinavian / luxury silhouettes) — no GLTF dependency.
 * Source reference: https://github.com/engrtitooo/RealEstateOS
 */

export type FurnitureStyle = "modern" | "scandinavian" | "luxury" | "minimalist";

type Part = {
  /** Local offset from furniture origin (center of footprint). */
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  radius?: number;
};

type FurnitureDef = {
  footprint: [number, number, number];
  parts: Part[];
};

const STYLES: Record<
  FurnitureStyle,
  { wood: string; upholstery: string; metal: string; linen: string }
> = {
  modern: {
    wood: "#8b7355",
    upholstery: "#5b7c8a",
    metal: "#9aa3ad",
    linen: "#e8e0d4",
  },
  scandinavian: {
    wood: "#d4b896",
    upholstery: "#c9d6c4",
    metal: "#b8b8b8",
    linen: "#f3efe8",
  },
  luxury: {
    wood: "#5c4030",
    upholstery: "#3d4f5f",
    metal: "#c9a86a",
    linen: "#f0e6d8",
  },
  minimalist: {
    wood: "#cfc6bc",
    upholstery: "#a8b2b8",
    metal: "#d0d4d8",
    linen: "#f7f4ef",
  },
};

function bedParts(
  w: number,
  d: number,
  h: number,
  palette: (typeof STYLES)[FurnitureStyle],
): Part[] {
  return [
    { position: [0, h * 0.15, 0], size: [w, h * 0.3, d], color: palette.wood },
    {
      position: [0, h * 0.45, -d * 0.05],
      size: [w * 0.92, h * 0.25, d * 0.85],
      color: palette.linen,
    },
    {
      position: [0, h * 0.7, -d * 0.38],
      size: [w * 0.9, h * 0.35, d * 0.18],
      color: palette.linen,
    },
    {
      position: [0, h * 0.85, d * 0.42],
      size: [w * 0.95, h * 0.55, 0.08],
      color: palette.wood,
    },
  ];
}

function sofaParts(
  w: number,
  d: number,
  h: number,
  palette: (typeof STYLES)[FurnitureStyle],
): Part[] {
  return [
    { position: [0, h * 0.35, 0], size: [w, h * 0.45, d], color: palette.upholstery },
    {
      position: [0, h * 0.75, d * 0.35],
      size: [w, h * 0.55, d * 0.22],
      color: palette.upholstery,
    },
    {
      position: [-w * 0.42, h * 0.7, -d * 0.05],
      size: [0.12, h * 0.5, d * 0.75],
      color: palette.upholstery,
    },
    {
      position: [w * 0.42, h * 0.7, -d * 0.05],
      size: [0.12, h * 0.5, d * 0.75],
      color: palette.upholstery,
    },
    {
      position: [0, h * 0.08, 0],
      size: [w * 0.9, h * 0.12, d * 0.85],
      color: palette.wood,
    },
  ];
}

function tableParts(
  w: number,
  d: number,
  h: number,
  palette: (typeof STYLES)[FurnitureStyle],
): Part[] {
  const leg = 0.08;
  const insetW = w * 0.4;
  const insetD = d * 0.4;
  return [
    { position: [0, h * 0.92, 0], size: [w, h * 0.08, d], color: palette.wood },
    { position: [-insetW, h * 0.45, -insetD], size: [leg, h * 0.85, leg], color: palette.wood },
    { position: [insetW, h * 0.45, -insetD], size: [leg, h * 0.85, leg], color: palette.wood },
    { position: [-insetW, h * 0.45, insetD], size: [leg, h * 0.85, leg], color: palette.wood },
    { position: [insetW, h * 0.45, insetD], size: [leg, h * 0.85, leg], color: palette.wood },
  ];
}

function deskParts(
  w: number,
  d: number,
  h: number,
  palette: (typeof STYLES)[FurnitureStyle],
): Part[] {
  return [
    { position: [0, h * 0.92, 0], size: [w, 0.05, d], color: palette.wood },
    { position: [-w * 0.42, h * 0.45, 0], size: [0.06, h * 0.85, d * 0.9], color: palette.wood },
    { position: [w * 0.42, h * 0.45, 0], size: [0.06, h * 0.85, d * 0.9], color: palette.wood },
    {
      position: [w * 0.25, h * 0.55, 0],
      size: [w * 0.3, h * 0.35, d * 0.85],
      color: palette.wood,
    },
  ];
}

const FOOTPRINTS: Record<string, [number, number, number]> = {
  "bed-queen": [1.6, 0.55, 2.0],
  "bed-king": [1.8, 0.55, 2.1],
  "bed-double": [1.4, 0.55, 1.9],
  "bed-single": [1.0, 0.5, 2.0],
  "sofa-2seat": [1.6, 0.75, 0.85],
  "sofa-3seat": [2.2, 0.75, 0.9],
  "sofa-compact": [1.8, 0.7, 0.85],
  "sofa-standard": [2.2, 0.75, 0.9],
  "table-4": [1.2, 0.75, 0.8],
  "table-dining-4": [1.2, 0.75, 0.8],
  "desk-standard": [1.2, 0.75, 0.6],
};

export function furnitureFootprint(catalogId: string): [number, number, number] {
  return FOOTPRINTS[catalogId] ?? [1, 0.5, 1];
}

export function buildFurnitureDef(
  catalogId: string,
  style: FurnitureStyle = "modern",
): FurnitureDef {
  const palette = STYLES[style];
  const [w, h, d] = furnitureFootprint(catalogId);
  if (catalogId.includes("bed")) {
    return { footprint: [w, h, d], parts: bedParts(w, d, h, palette) };
  }
  if (catalogId.includes("sofa")) {
    return { footprint: [w, h, d], parts: sofaParts(w, d, h, palette) };
  }
  if (catalogId.includes("desk")) {
    return { footprint: [w, h, d], parts: deskParts(w, d, h, palette) };
  }
  if (catalogId.includes("table")) {
    return { footprint: [w, h, d], parts: tableParts(w, d, h, palette) };
  }
  return {
    footprint: [w, h, d],
    parts: [{ position: [0, h / 2, 0], size: [w, h, d], color: palette.wood }],
  };
}

export function furnitureStyleFromPaletteLabel(label?: string): FurnitureStyle {
  const l = (label ?? "").toLowerCase();
  if (l.includes("scand") || l.includes("ivory") || l.includes("clay")) return "scandinavian";
  if (l.includes("teal") || l.includes("lux")) return "luxury";
  if (l.includes("minimal")) return "minimalist";
  return "modern";
}


export { buildFurnitureDef as buildFurnitureIcon };
