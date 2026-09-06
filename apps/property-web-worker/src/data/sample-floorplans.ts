import { sampleFloorPlans } from "@ancu/shared";
import type { FloorPlanDocument } from "@ancu/shared";

const UNIT_TO_SAMPLE: Record<string, FloorPlanDocument> = {
  "studio-a": sampleFloorPlans.studioEatonPark,
  studio: sampleFloorPlans.studioEatonPark,
  "studio-s": sampleFloorPlans.studioEatonPark,
  "1br-b": sampleFloorPlans.oneBedroomElysian,
  "1br-m": sampleFloorPlans.oneBedroomElysian,
  "2br-c": sampleFloorPlans.twoBedroomCeladonCity,
  "2br": sampleFloorPlans.twoBedroomCeladonCity,
  "3br-l": sampleFloorPlans.twoBedroomCeladonCity,
};

/** Resolve a unit slug to a published or seed FloorPlanDocument. */
export function getSampleFloorPlan(unitSlug: string): FloorPlanDocument {
  return UNIT_TO_SAMPLE[unitSlug] ?? sampleFloorPlans.studioEatonPark;
}

export const SAMPLE_FLOOR_PLANS = [
  sampleFloorPlans.studioEatonPark,
  sampleFloorPlans.oneBedroomElysian,
  sampleFloorPlans.twoBedroomCeladonCity,
];
