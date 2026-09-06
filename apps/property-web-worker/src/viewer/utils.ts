import type { FloorPlanDocument, Wall } from "@ancu/shared";

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

export function wallCenter(wall: Wall): [number, number, number] {
  const cx = (wall.start[0] + wall.end[0]) / 2;
  const cz = (wall.start[1] + wall.end[1]) / 2;
  return [cx, wall.heightM / 2, cz];
}

export function wallLength(wall: Wall): number {
  const dx = wall.end[0] - wall.start[0];
  const dz = wall.end[1] - wall.start[1];
  return Math.sqrt(dx * dx + dz * dz);
}

export function wallRotation(wall: Wall): number {
  const dx = wall.end[0] - wall.start[0];
  const dz = wall.end[1] - wall.start[1];
  return Math.atan2(dz, dx);
}

export function documentBounds(doc: FloorPlanDocument) {
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  for (const wall of doc.walls) {
    minX = Math.min(minX, wall.start[0], wall.end[0]);
    minZ = Math.min(minZ, wall.start[1], wall.end[1]);
    maxX = Math.max(maxX, wall.start[0], wall.end[0]);
    maxZ = Math.max(maxZ, wall.start[1], wall.end[1]);
  }
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const size = Math.max(maxX - minX, maxZ - minZ);
  return { minX, minZ, maxX, maxZ, cx, cz, size };
}

export function roomCentroid(polygon: [number, number][]): [number, number] {
  let x = 0;
  let z = 0;
  for (const [px, pz] of polygon) {
    x += px;
    z += pz;
  }
  return [x / polygon.length, z / polygon.length];
}

const CATALOG_SIZES: Record<string, [number, number, number]> = {
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

const FIXTURE_SIZES: Record<string, [number, number, number]> = {
  toilet: [0.4, 0.4, 0.6],
  sink: [0.5, 0.85, 0.4],
  stove: [0.6, 0.9, 0.6],
  shower: [0.9, 2.0, 0.9],
};

export function catalogSize(catalogId: string): [number, number, number] {
  return CATALOG_SIZES[catalogId] ?? [1, 0.5, 1];
}

export function fixtureSize(type: string): [number, number, number] {
  return FIXTURE_SIZES[type] ?? [0.5, 0.5, 0.5];
}

export function furnitureColor(catalogId: string): string {
  if (catalogId.includes("bed")) return "#b07d5e";
  if (catalogId.includes("sofa")) return "#c4916f";
  if (catalogId.includes("desk") || catalogId.includes("table")) return "#9a6b4f";
  return "#a89f96";
}

export function fixtureColor(type: string): string {
  return type === "toilet" || type === "sink" ? "#d4ebe8" : "#c9bfb2";
}

export function qaMetadata(doc: FloorPlanDocument) {
  const warnings = doc.validation.warnings.map((w) => w.message).join("; ");
  const errors = doc.validation.errors.map((e) => e.message).join("; ");
  const summary = [errors, warnings].filter(Boolean).join(" · ") || "Validation passed";
  return {
    sourceNote: doc.source.provenanceNote,
    confidence: doc.confidence.overall,
    validationSummary: summary,
  };
}
