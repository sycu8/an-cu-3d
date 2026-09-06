/**
 * Session-local lifestyle preferences (no account required).
 */
import {
  DEFAULT_LIFESTYLE,
  type LifestylePreferences,
} from "@ancu/shared";

const STORAGE_KEY = "ancu.lifestylePreferences.v1";

export function loadLifestylePreferences(): LifestylePreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_LIFESTYLE, weights: { ...DEFAULT_LIFESTYLE.weights } };
    }
    const parsed = JSON.parse(raw) as Partial<LifestylePreferences>;
    return {
      ...DEFAULT_LIFESTYLE,
      ...parsed,
      weights: { ...DEFAULT_LIFESTYLE.weights, ...parsed.weights },
    };
  } catch {
    return { ...DEFAULT_LIFESTYLE, weights: { ...DEFAULT_LIFESTYLE.weights } };
  }
}

export function saveLifestylePreferences(prefs: LifestylePreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore quota / private mode
  }
}
