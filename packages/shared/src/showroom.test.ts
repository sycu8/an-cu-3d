import { describe, expect, it } from "vitest";
import {
  DEFAULT_MATERIAL_PALETTES,
  LIGHTING_PRESETS,
  buildShowroomSharePath,
} from "./showroom.js";

describe("showroom presets", () => {
  it("exposes day / golden_hour / evening lighting", () => {
    expect(Object.keys(LIGHTING_PRESETS).sort()).toEqual([
      "day",
      "evening",
      "golden_hour",
    ]);
    expect(LIGHTING_PRESETS.day.label).toMatch(/ngày/i);
  });

  it("ships at least three material palettes", () => {
    expect(DEFAULT_MATERIAL_PALETTES.length).toBeGreaterThanOrEqual(3);
    for (const p of DEFAULT_MATERIAL_PALETTES) {
      expect(p.floor).toMatch(/^#/);
      expect(p.wall).toMatch(/^#/);
      expect(p.cabinet).toMatch(/^#/);
      expect(p.accent).toMatch(/^#/);
    }
  });

  it("builds shareable showroom paths for sales links", () => {
    expect(
      buildShowroomSharePath("celadon-city", {
        unit: "2br-a",
        preset: "golden_hour",
        palette: "Ivory ấm",
        view: "3d",
      }),
    ).toBe(
      "/projects/celadon-city/showroom?unit=2br-a&preset=golden_hour&palette=Ivory+%E1%BA%A5m",
    );

    expect(
      buildShowroomSharePath("eaton-park", {
        unit: "studio",
        preset: "evening",
        view: "2d",
      }),
    ).toBe("/projects/eaton-park/showroom?unit=studio&preset=evening&view=2d");
  });
});
