/**
 * Project-level metric helpers for weighted comparison.
 */

import { haversineKm } from "../routing.js";
import {
  scoreWeightedDecision,
  type DecisionWeights,
  type MetricScoreInput,
  type WeightedDecisionResult,
} from "./preferences.js";

export interface ProjectScoreCandidate {
  id: string;
  slug: string;
  name: string;
  pricePerSqmMid?: number | null;
  spaceScore?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  schoolPoiCount?: number | null;
  amenityPoiCount?: number | null;
}

export interface RankedProject {
  candidate: ProjectScoreCandidate;
  result: WeightedDecisionResult;
  commuteDistanceKm: number | null;
}

function normalizeInverted(
  value: number | null | undefined,
  min: number,
  max: number,
): number | null {
  if (value == null || !Number.isFinite(value) || max <= min) return null;
  const clamped = Math.min(max, Math.max(min, value));
  return 1 - (clamped - min) / (max - min);
}

function normalizeDirect(
  value: number | null | undefined,
  min: number,
  max: number,
): number | null {
  if (value == null || !Number.isFinite(value) || max <= min) return null;
  const clamped = Math.min(max, Math.max(min, value));
  return (clamped - min) / (max - min);
}

export function buildRelativeMetrics(
  candidate: ProjectScoreCandidate,
  cohort: ProjectScoreCandidate[],
  destination?: { latitude: number; longitude: number } | null,
): MetricScoreInput & { commuteDistanceKm: number | null } {
  const prices = cohort
    .map((c) => c.pricePerSqmMid)
    .filter((v): v is number => v != null && Number.isFinite(v));
  const spaces = cohort
    .map((c) => c.spaceScore)
    .filter((v): v is number => v != null && Number.isFinite(v));
  const schools = cohort
    .map((c) => c.schoolPoiCount ?? 0)
    .filter((v) => Number.isFinite(v));
  const amenities = cohort
    .map((c) => c.amenityPoiCount ?? 0)
    .filter((v) => Number.isFinite(v));

  let commuteDistanceKm: number | null = null;
  let commute: number | null = null;
  if (destination && candidate.latitude != null && candidate.longitude != null) {
    commuteDistanceKm =
      Math.round(
        haversineKm(
          { latitude: candidate.latitude, longitude: candidate.longitude },
          destination,
        ) * 100,
      ) / 100;
    const distances = cohort
      .map((c) => {
        if (c.latitude == null || c.longitude == null) return null;
        return haversineKm(
          { latitude: c.latitude, longitude: c.longitude },
          destination,
        );
      })
      .filter((v): v is number => v != null);
    if (distances.length) {
      commute = normalizeInverted(
        commuteDistanceKm,
        Math.min(...distances),
        Math.max(...distances),
      );
    }
  }

  return {
    budget:
      prices.length >= 2
        ? normalizeInverted(
            candidate.pricePerSqmMid,
            Math.min(...prices),
            Math.max(...prices),
          )
        : prices.length === 1 && candidate.pricePerSqmMid != null
          ? 0.5
          : null,
    space:
      spaces.length >= 1
        ? normalizeDirect(
            candidate.spaceScore,
            Math.min(...spaces, 0),
            Math.max(...spaces, 1),
          )
        : null,
    commute,
    schools:
      schools.length >= 1
        ? normalizeDirect(
            candidate.schoolPoiCount ?? 0,
            Math.min(...schools),
            Math.max(...schools, 1),
          )
        : null,
    amenities:
      amenities.length >= 1
        ? normalizeDirect(
            candidate.amenityPoiCount ?? 0,
            Math.min(...amenities),
            Math.max(...amenities, 1),
          )
        : null,
    commuteDistanceKm,
  };
}

export function rankProjects(
  candidates: ProjectScoreCandidate[],
  weights: DecisionWeights,
  destination?: { latitude: number; longitude: number } | null,
): RankedProject[] {
  return candidates
    .map((candidate) => {
      const metrics = buildRelativeMetrics(candidate, candidates, destination);
      const { commuteDistanceKm, ...scoreMetrics } = metrics;
      return {
        candidate,
        result: scoreWeightedDecision(scoreMetrics, weights),
        commuteDistanceKm,
      };
    })
    .sort((a, b) => {
      if (a.result.overall == null && b.result.overall == null) return 0;
      if (a.result.overall == null) return 1;
      if (b.result.overall == null) return -1;
      return b.result.overall - a.result.overall;
    });
}

export function parsePriceMidTrieu(
  priceRange: string | null | undefined,
): number | null {
  if (!priceRange) return null;
  if (/chờ xác minh|thứ cấp|tham chiếu/i.test(priceRange)) return null;
  const nums = [...priceRange.matchAll(/(\d+(?:[.,]\d+)?)/g)].map((m) =>
    Number.parseFloat(m[1].replace(",", ".")),
  );
  if (!nums.length) return null;
  if (nums.length === 1) return nums[0];
  return (nums[0] + nums[1]) / 2;
}
