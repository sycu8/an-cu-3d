export type ConversionJobStatus =
  | "DISCOVERED"
  | "DOWNLOADED"
  | "NORMALIZED"
  | "ANALYZING"
  | "RECONSTRUCTING"
  | "VALIDATING"
  | "NEEDS_REVIEW"
  | "APPROVED"
  | "FAILED"
  | "PUBLISHED";

export const CONVERSION_STATUS_ORDER: ConversionJobStatus[] = [
  "DISCOVERED",
  "DOWNLOADED",
  "NORMALIZED",
  "ANALYZING",
  "RECONSTRUCTING",
  "VALIDATING",
  "NEEDS_REVIEW",
  "APPROVED",
  "FAILED",
  "PUBLISHED",
];

export const TERMINAL_STATUSES: ConversionJobStatus[] = [
  "NEEDS_REVIEW",
  "APPROVED",
  "FAILED",
  "PUBLISHED",
];

export function canTransition(
  from: ConversionJobStatus,
  to: ConversionJobStatus,
): boolean {
  if (from === to) return true;

  if (from === "FAILED" || from === "PUBLISHED") {
    return false;
  }

  const pipeline: ConversionJobStatus[] = [
    "DISCOVERED",
    "DOWNLOADED",
    "NORMALIZED",
    "ANALYZING",
    "RECONSTRUCTING",
    "VALIDATING",
  ];

  const fromIdx = pipeline.indexOf(from);
  const toIdx = pipeline.indexOf(to);

  if (fromIdx >= 0 && toIdx >= 0) {
    return toIdx === fromIdx + 1;
  }

  if (from === "VALIDATING") {
    return to === "NEEDS_REVIEW" || to === "APPROVED" || to === "FAILED";
  }

  if (from === "NEEDS_REVIEW") {
    return to === "APPROVED" || to === "FAILED";
  }

  if (from === "APPROVED") {
    return to === "PUBLISHED";
  }

  return false;
}

export function nextPipelineStatus(
  current: ConversionJobStatus,
): ConversionJobStatus | null {
  const pipeline: ConversionJobStatus[] = [
    "DISCOVERED",
    "DOWNLOADED",
    "NORMALIZED",
    "ANALYZING",
    "RECONSTRUCTING",
    "VALIDATING",
  ];
  const idx = pipeline.indexOf(current);
  if (idx < 0 || idx >= pipeline.length - 1) return null;
  return pipeline[idx + 1] ?? null;
}
