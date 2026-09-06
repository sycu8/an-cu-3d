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

/** Short buyer-facing explanations — used instead of opaque numeric weights. */
export const PREFERENCE_HINTS_VI: Record<PreferenceKey, string> = {
  budget: "Giá hợp túi tiền hơn so với các dự án khác",
  space: "Số phòng và diện tích phù hợp hộ gia đình",
  commute: "Gần nơi bạn thường đến",
  schools: "Nhiều trường học quanh dự án",
  amenities: "Tiện ích / điểm quanh dự án phong phú",
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
  /** Available cash for purchase, in tỷ VND */
  availableCashTy?: number;
  /** Expected loan term in years (used with Big-4 average rate) */
  loanTermYears?: number;
  /**
   * Criteria ordered most → least important.
   * Ranking UX writes this; weights are derived for scoring.
   */
  priorityOrder?: PreferenceKey[];
  commuteLabel?: string;
  commuteDestination?: { latitude: number; longitude: number };
  weights: DecisionWeights;
}

/** Default order mirrors historical DEFAULT_WEIGHTS relative importance. */
export const DEFAULT_PRIORITY_ORDER: PreferenceKey[] = [
  "space",
  "budget",
  "commute",
  "schools",
  "amenities",
];

/** Rank → weight mapping (1st most important). Absolute scale is arbitrary; ratios matter. */
const RANK_WEIGHTS = [100, 70, 45, 25, 15] as const;

export function weightsFromPriorityOrder(
  order: PreferenceKey[],
): DecisionWeights {
  const normalized = normalizePriorityOrder(order);
  const weights: DecisionWeights = {
    budget: 0,
    space: 0,
    commute: 0,
    schools: 0,
    amenities: 0,
  };
  normalized.forEach((key, index) => {
    weights[key] = RANK_WEIGHTS[Math.min(index, RANK_WEIGHTS.length - 1)] ?? 10;
  });
  return weights;
}

export function priorityOrderFromWeights(
  weights: DecisionWeights,
): PreferenceKey[] {
  return [...PREFERENCE_KEYS].sort((a, b) => {
    const diff = weights[b] - weights[a];
    if (diff !== 0) return diff;
    return PREFERENCE_KEYS.indexOf(a) - PREFERENCE_KEYS.indexOf(b);
  });
}

export function normalizePriorityOrder(
  order: PreferenceKey[] | undefined | null,
): PreferenceKey[] {
  const seen = new Set<PreferenceKey>();
  const result: PreferenceKey[] = [];
  for (const key of order ?? []) {
    if (PREFERENCE_KEYS.includes(key) && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  for (const key of PREFERENCE_KEYS) {
    if (!seen.has(key)) result.push(key);
  }
  return result;
}

export function resolvePriorityOrder(
  prefs: Pick<LifestylePreferences, "priorityOrder" | "weights">,
): PreferenceKey[] {
  if (prefs.priorityOrder?.length) {
    return normalizePriorityOrder(prefs.priorityOrder);
  }
  return priorityOrderFromWeights(prefs.weights);
}

export function withDerivedWeights(
  prefs: LifestylePreferences,
): LifestylePreferences {
  const priorityOrder = resolvePriorityOrder(prefs);
  return {
    ...prefs,
    priorityOrder,
    weights: weightsFromPriorityOrder(priorityOrder),
  };
}

export const DEFAULT_WEIGHTS: DecisionWeights =
  weightsFromPriorityOrder(DEFAULT_PRIORITY_ORDER);

export const DEFAULT_LOAN_TERM_YEARS = 20;

export const DEFAULT_LIFESTYLE: LifestylePreferences = {
  household: "couple",
  wfh: 0,
  vehicle: "no_car",
  availableCashTy: undefined,
  loanTermYears: DEFAULT_LOAN_TERM_YEARS,
  priorityOrder: [...DEFAULT_PRIORITY_ORDER],
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
    explainVi: `Điểm ${overall}/100 từ ${available.length} tiêu chí có dữ liệu. Nổi bật nhất theo ưu tiên của bạn: ${PREFERENCE_LABELS_VI[top.key]}.`,
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
