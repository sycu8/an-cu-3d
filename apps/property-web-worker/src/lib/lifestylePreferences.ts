/**
 * Session-local lifestyle preferences (no account required).
 */
import {
  DEFAULT_LIFESTYLE,
  DEFAULT_LOAN_TERM_YEARS,
  withDerivedWeights,
  type LifestylePreferences,
} from "@ancu/shared";

const STORAGE_KEY = "ancu.lifestylePreferences.v2";
const LEGACY_STORAGE_KEY = "ancu.lifestylePreferences.v1";

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function hydrate(
  parsed: Partial<LifestylePreferences> | null | undefined,
): LifestylePreferences {
  const availableCashTy = coerceNumber(parsed?.availableCashTy);
  const loanTermYears =
    coerceNumber(parsed?.loanTermYears) ?? DEFAULT_LOAN_TERM_YEARS;

  return withDerivedWeights({
    ...DEFAULT_LIFESTYLE,
    ...parsed,
    availableCashTy:
      availableCashTy != null && availableCashTy >= 0
        ? availableCashTy
        : undefined,
    loanTermYears: loanTermYears > 0 ? loanTermYears : DEFAULT_LOAN_TERM_YEARS,
    weights: {
      ...DEFAULT_LIFESTYLE.weights,
      ...(parsed?.weights ?? {}),
    },
    priorityOrder: parsed?.priorityOrder,
  });
}

export function loadLifestylePreferences(): LifestylePreferences {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      return hydrate(null);
    }
    const parsed = JSON.parse(raw) as Partial<LifestylePreferences>;
    return hydrate(parsed);
  } catch {
    return hydrate(null);
  }
}

export function saveLifestylePreferences(prefs: LifestylePreferences): void {
  try {
    const normalized = withDerivedWeights(prefs);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // ignore quota / private mode
  }
}
