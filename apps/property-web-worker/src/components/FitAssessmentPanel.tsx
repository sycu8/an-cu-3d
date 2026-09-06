import { useMemo } from "react";
import {
  assessUnitFit,
  type LifestylePreferences,
  type UnitFitAssessment,
} from "@ancu/shared";
import "./FitAssessmentPanel.css";

type FitAssessmentPanelProps = {
  preferences: LifestylePreferences;
  bedrooms?: number | null;
  bathrooms?: number | null;
  rooms?: Array<{
    id: string;
    type?: string;
    name?: string;
    polygon: [number, number][];
    areaSqM?: number;
  }>;
  layoutEfficiency?: number | null;
  floorplanVerified?: boolean;
  title?: string;
};

export function FitAssessmentPanel({
  preferences,
  bedrooms,
  bathrooms,
  rooms,
  layoutEfficiency,
  floorplanVerified = false,
  title = "Căn này có hợp với bạn?",
}: FitAssessmentPanelProps) {
  const assessment: UnitFitAssessment = useMemo(
    () =>
      assessUnitFit({
        preferences,
        bedrooms,
        bathrooms,
        rooms,
        layoutEfficiency,
        floorplanVerified,
      }),
    [preferences, bedrooms, bathrooms, rooms, layoutEfficiency, floorplanVerified],
  );

  return (
    <section className="fit-assessment" aria-label={title}>
      <header className="fit-assessment-head">
        <h3>{title}</h3>
        {assessment.sufficient && assessment.overall != null ? (
          <p className="fit-assessment-score">
            <strong>{assessment.overall}</strong>
            <span>/100</span>
          </p>
        ) : (
          <p className="fit-assessment-score fit-assessment-score--muted">—</p>
        )}
      </header>
      <p className="fit-assessment-explain">{assessment.explainVi}</p>
      <ul className="fit-assessment-components">
        {assessment.components.map((c) => (
          <li key={c.key}>
            <div>
              <strong>{c.labelVi}</strong>
              <p>{c.explainVi}</p>
            </div>
            <em>{c.score != null ? Math.round(c.score * 100) : "—"}</em>
          </li>
        ))}
      </ul>
      {assessment.recommendationsVi.length > 0 && (
        <ul className="fit-assessment-recs">
          {assessment.recommendationsVi.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
