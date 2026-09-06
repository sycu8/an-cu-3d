/**
 * Central review / confidence thresholds (severity-aware).
 * Critical geometry (walls, scale, openings, room topology) is stricter
 * than decorative furniture annotations.
 */

export type ObjectSeverity = "critical" | "important" | "optional";

export const OBJECT_SEVERITY: Record<string, ObjectSeverity> = {
  wall: "critical",
  scale: "critical",
  room: "critical",
  door: "critical",
  window: "important",
  fixture: "important",
  furniture: "optional",
  label: "optional",
  dimension: "important",
};

export const CONFIDENCE_THRESHOLDS = {
  /** Auto-acceptable for critical objects */
  autoAccept: 0.9,
  /** Accepted with caution */
  caution: 0.8,
  /** Below this → needs_review for critical/important */
  needsReview: 0.8,
  /** Optional objects may ship below this with a warning */
  optionalWarn: 0.6,
} as const;

export type ReviewDisposition = "auto_accept" | "caution" | "needs_review";

export function dispositionForConfidence(
  score: number,
  objectKind: string,
): ReviewDisposition {
  const severity = OBJECT_SEVERITY[objectKind] ?? "important";
  if (severity === "optional") {
    if (score >= CONFIDENCE_THRESHOLDS.optionalWarn) return "auto_accept";
    return "caution";
  }
  if (score >= CONFIDENCE_THRESHOLDS.autoAccept) return "auto_accept";
  if (score >= CONFIDENCE_THRESHOLDS.caution) return "caution";
  return "needs_review";
}

/** Aggregate: any critical needs_review → document needs review. */
export function documentNeedsHumanReview(
  objects: Array<{ kind: string; score: number }>,
): boolean {
  return objects.some(
    (o) => dispositionForConfidence(o.score, o.kind) === "needs_review",
  );
}
