import { sampleFloorPlans } from "@ancu/shared";
import type { FloorPlanDocument } from "@ancu/shared";

/** Map unit slugs and floorplanKey values to seed FloorPlanDocument samples. */
const UNIT_TO_SAMPLE: Record<string, FloorPlanDocument> = {
  // unit slugs
  "studio-a": sampleFloorPlans.studioEatonPark,
  studio: sampleFloorPlans.studioEatonPark,
  "studio-s": sampleFloorPlans.studioEatonPark,
  "1br-b": sampleFloorPlans.oneBedroomElysian,
  "1br-m": sampleFloorPlans.oneBedroomElysian,
  "2br-c": sampleFloorPlans.twoBedroomCeladonCity,
  "2br": sampleFloorPlans.twoBedroomCeladonCity,
  "3br-l": sampleFloorPlans.twoBedroomCeladonCity,
  // floorplanKey values used by demo / D1 fixtures
  "one-bedroom": sampleFloorPlans.oneBedroomElysian,
  "two-bedroom": sampleFloorPlans.twoBedroomCeladonCity,
};

/** Resolve a unit slug or floorplan key to a published/seed FloorPlanDocument. */
export function getSampleFloorPlan(unitSlug: string): FloorPlanDocument {
  return UNIT_TO_SAMPLE[unitSlug] ?? sampleFloorPlans.studioEatonPark;
}

export const SAMPLE_FLOOR_PLANS = [
  sampleFloorPlans.studioEatonPark,
  sampleFloorPlans.oneBedroomElysian,
  sampleFloorPlans.twoBedroomCeladonCity,
];
