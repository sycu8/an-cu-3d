/** Relative deviation between stated and computed area (0 = exact match). */
export function areaDeviation(
  statedAreaSqm: number,
  computedAreaSqm: number,
): number {
  if (statedAreaSqm <= 0 || computedAreaSqm <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.abs(statedAreaSqm - computedAreaSqm) / statedAreaSqm;
}

export function areaWithinTolerance(
  statedAreaSqm: number,
  computedAreaSqm: number,
  tolerance = 0.05,
): boolean {
  return areaDeviation(statedAreaSqm, computedAreaSqm) <= tolerance;
}
