/**
 * Session preference model for weighted project/unit comparison.
 * Deterministic — no LLM ranking. Missing metrics are skipped, not invented.
 */

export type PreferenceKey =
  | "budget"
  | "space"
  | "commute"
  | "schools"
  | "amenities";

export const PREFERENCE_KEYS: PreferenceKey[] = [
  "budget",
  "space",
  "commute",
  "schools",
  "amenities",
];

export const PREFERENCE_LABELS_VI: Record<PreferenceKey, string> = {
  budget: "Ngân sách",
  space: "Không gian",
  commute: "Di chuyển",
  schools: "Trường học",
  amenities: "Tiện ích",
};

export type HouseholdProfile =
  | "solo"
  | "couple"
  | "family_1_child"
  | "family_2_children";

export type WfhCount = 0 | 1 | 2;
export type VehiclePreference = "car" | "no_car";

export interface DecisionWeights {
  budget: number;
  space: number;
  commute: number;
  schools: number;
  amenities: number;
}

export interface LifestylePreferences {
  household: HouseholdProfile;
  wfh: WfhCount;
  vehicle: VehiclePreference;
  commuteLabel?: string;
  commuteDestination?: { latitude: number; longitude: number };
  weights: DecisionWeights;
}

export const DEFAULT_WEIGHTS: DecisionWeights = {
  budget: 70,
  space: 80,
  commute: 60,
  schools: 50,
  amenities: 50,
};

export const DEFAULT_LIFESTYLE: LifestylePreferences = {
  household: "couple",
  wfh: 0,
  vehicle: "no_car",
  weights: { ...DEFAULT_WEIGHTS },
};

export function normalizeWeights(
  weights: DecisionWeights,
): Record<PreferenceKey, number> {
  const sum = PREFERENCE_KEYS.reduce((s, k) => s + Math.max(0, weights[k]), 0);
  if (sum <= 0) {
    const eq = 1 / PREFERENCE_KEYS.length;
    return Object.fromEntries(PREFERENCE_KEYS.map((k) => [k, eq])) as Record<
      PreferenceKey,
      number
    >;
  }
  return Object.fromEntries(
    PREFERENCE_KEYS.map((k) => [k, Math.max(0, weights[k]) / sum]),
  ) as Record<PreferenceKey, number>;
}

export interface MetricScoreInput {
  budget?: number | null;
  space?: number | null;
  commute?: number | null;
  schools?: number | null;
  amenities?: number | null;
}

export interface DimensionScore {
  key: PreferenceKey;
  weight: number;
  raw: number | null;
  contribution: number;
  available: boolean;
}

export interface WeightedDecisionResult {
  overall: number | null;
  dimensions: DimensionScore[];
  usedWeightSum: number;
  explainVi: string;
  sufficient: boolean;
}

export function scoreWeightedDecision(
  metrics: MetricScoreInput,
  weights: DecisionWeights,
): WeightedDecisionResult {
  const normalized = normalizeWeights(weights);
  const dimensions: DimensionScore[] = PREFERENCE_KEYS.map((key) => {
    const raw = metrics[key];
    const available = typeof raw === "number" && Number.isFinite(raw);
    return {
      key,
      weight: normalized[key],
      raw: available ? Math.min(1, Math.max(0, raw as number)) : null,
      contribution: 0,
      available,
    };
  });

  const available = dimensions.filter((d) => d.available && d.raw != null);
  const usedWeightSum = available.reduce((s, d) => s + d.weight, 0);

  if (usedWeightSum <= 0 || available.length === 0) {
    return {
      overall: null,
      dimensions,
      usedWeightSum: 0,
      explainVi:
        "Chưa đủ dữ liệu đã xác minh để xếp hạng theo ưu tiên của bạn.",
      sufficient: false,
    };
  }

  let overall = 0;
  for (const d of dimensions) {
    if (!d.available || d.raw == null) continue;
    const effective = d.weight / usedWeightSum;
    d.contribution = Math.round(d.raw * effective * 1000) / 1000;
    overall += d.contribution;
  }
  overall = Math.round(overall * 100);

  const top = [...available].sort(
    (a, b) => (b.raw ?? 0) * b.weight - (a.raw ?? 0) * a.weight,
  )[0];

  return {
    overall,
    dimensions,
    usedWeightSum,
    explainVi: `Điểm ${overall}/100 từ ${available.length} tiêu chí có dữ liệu. Nổi bật nhất theo trọng số: ${PREFERENCE_LABELS_VI[top.key]}.`,
    sufficient: true,
  };
}

export function preferredBedrooms(household: HouseholdProfile): number {
  switch (household) {
    case "solo":
      return 1;
    case "couple":
      return 2;
    case "family_1_child":
      return 2;
    case "family_2_children":
      return 3;
  }
}
