/** Showroom / sample-home visual presets. */

export type LightingPreset = "day" | "golden_hour" | "evening";

export type MaterialPalette = {
  floor: string;
  wall: string;
  cabinet: string;
  accent: string;
  label: string;
};

export type RoomHotspot = {
  id: string;
  roomId: string;
  label: string;
  order: number;
  cameraHint?: "overview" | "close";
};

export const LIGHTING_PRESETS: Record<
  LightingPreset,
  {
    label: string;
    ambient: number;
    directional: number;
    sunColor: string;
    skyColor: string;
    groundColor: string;
  }
> = {
  day: {
    label: "Ban ngày",
    ambient: 0.55,
    directional: 1.1,
    sunColor: "#fff8e7",
    skyColor: "#cfe8f5",
    groundColor: "#f5f0ea",
  },
  golden_hour: {
    label: "Hoàng hôn",
    ambient: 0.4,
    directional: 0.95,
    sunColor: "#ffb067",
    skyColor: "#f0c9a0",
    groundColor: "#ebe0d4",
  },
  evening: {
    label: "Buổi tối",
    ambient: 0.22,
    directional: 0.45,
    sunColor: "#a8c4ff",
    skyColor: "#1a2433",
    groundColor: "#2a2622",
  },
};

export const DEFAULT_MATERIAL_PALETTES: MaterialPalette[] = [
  {
    label: "Ivory ấm",
    floor: "#d9cbb8",
    wall: "#f4efe8",
    cabinet: "#8b7355",
    accent: "#285A52",
  },
  {
    label: "Teal hiện đại",
    floor: "#cfc6bc",
    wall: "#eef4f3",
    cabinet: "#3d5c57",
    accent: "#C9825B",
  },
  {
    label: "Clay ấm",
    floor: "#cbb39a",
    wall: "#f7f1eb",
    cabinet: "#6b4f3a",
    accent: "#C9825B",
  },
];


export type ProjectShowroomConfig = {
  lightingDefault?: LightingPreset;
  materialPaletteLabel?: string;
  hotspots?: { roomHint: string; label: string; order: number }[];
  materialFromPhoto?: {
    floor: string;
    wall: string;
    cabinet: string;
    accent: string;
    notes?: string;
  };
};
