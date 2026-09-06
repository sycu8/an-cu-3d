import { floorplanVerificationLabel, type FloorplanVerificationStatusType } from "@ancu/shared";
import {
  buildDataTrustInfo,
  dataTrustShortLabel,
  type DataTrustStateType,
} from "@ancu/shared";
import { useId, useState } from "react";
import "./DataTrustBadge.css";

export interface DataTrustBadgeProps {
  sourceClass?: string | null;
  provenance?: string | null;
  verifiedAt?: string | null;
  confidence?: number | null;
  floorplanVerification?: FloorplanVerificationStatusType | null;
  /** Compact chip only (no expand). */
  compact?: boolean;
  className?: string;
}

function floorplanToTrustState(
  status: FloorplanVerificationStatusType,
): DataTrustStateType {
  switch (status) {
    case "verified":
      return "verified";
    case "partially_verified":
      return "estimated";
    case "estimated":
      return "estimated";
    case "illustrative":
      return "illustrative";
    case "unknown":
      return "unknown";
  }
}

export function DataTrustBadge({
  sourceClass,
  provenance,
  verifiedAt,
  confidence,
  floorplanVerification,
  compact = false,
  className = "",
}: DataTrustBadgeProps) {
  const panelId = useId();
  const [open, setOpen] = useState(false);

  const forceState = floorplanVerification
    ? floorplanToTrustState(floorplanVerification)
    : undefined;
  const info = buildDataTrustInfo({
    sourceClass,
    provenance,
    verifiedAt,
    confidence,
    forceState,
  });

  const short = floorplanVerification
    ? floorplanVerificationLabel(floorplanVerification)
    : info.shortLabel;

  if (compact) {
    return (
      <span
        className={`data-trust-badge data-trust-badge--${info.state} data-trust-badge--compact ${className}`.trim()}
        title={info.label}
      >
        {dataTrustShortLabel(info.state)}
      </span>
    );
  }

  return (
    <div className={`data-trust-badge data-trust-badge--${info.state} ${className}`.trim()}>
      <button
        type="button"
        className="data-trust-badge__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="data-trust-badge__dot" aria-hidden="true" />
        <span className="data-trust-badge__label">{short}</span>
        <span className="data-trust-badge__chevron" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div id={panelId} className="data-trust-badge__panel" role="region">
          <p>{info.label}</p>
          {floorplanVerification && (
            <p className="data-trust-badge__meta">
              Mặt bằng: {floorplanVerificationLabel(floorplanVerification)}
            </p>
          )}
          {info.verifiedAt && (
            <p className="data-trust-badge__meta">Cập nhật: {info.verifiedAt}</p>
          )}
          {info.provenanceNote &&
            info.provenanceNote !== info.label &&
            !/^chờ xác minh$/i.test(info.provenanceNote.trim()) && (
              <p className="data-trust-badge__meta">{info.provenanceNote}</p>
            )}
        </div>
      )}
    </div>
  );
}
