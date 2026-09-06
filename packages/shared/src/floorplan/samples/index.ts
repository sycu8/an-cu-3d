import studioEatonPark from "./studio-eaton-park.json" with { type: "json" };
import oneBedroomElysian from "./one-bedroom-elysian.json" with { type: "json" };
import twoBedroomCeladonCity from "./two-bedroom-celadon-city.json" with { type: "json" };
import type { FloorPlanDocument } from "../types.js";
import { parseFloorPlanDocument } from "../schema.js";

export const sampleFloorPlans = {
  studioEatonPark: parseFloorPlanDocument(studioEatonPark) satisfies FloorPlanDocument,
  oneBedroomElysian: parseFloorPlanDocument(oneBedroomElysian) satisfies FloorPlanDocument,
  twoBedroomCeladonCity: parseFloorPlanDocument(twoBedroomCeladonCity) satisfies FloorPlanDocument,
} as const;

export type SampleFloorPlanKey = keyof typeof sampleFloorPlans;

export { studioEatonPark, oneBedroomElysian, twoBedroomCeladonCity };
