import {
  computeSpatialMetrics,
  computeSpaceScore,
  evaluateCommonBedroomFits,
  evaluateCommonLivingFits,
  floorplanVerificationLabel,
  type FloorPlanDocument,
  type FloorplanVerificationStatusType,
} from "@ancu/shared";
import "./SpaceInsights.css";

type SpaceInsightsProps = {
  document: FloorPlanDocument | null;
  verification: FloorplanVerificationStatusType;
};

/**
 * Lightweight spatial intelligence panel.
 * Never invents metrics when geometry/scale is insufficient.
 */
export function SpaceInsights({ document, verification }: SpaceInsightsProps) {
  if (
    !document ||
    verification === "unknown" ||
    verification === "illustrative" ||
    verification === "estimated" ||
    document.scale.estimated ||
    document.scale.confidence < 0.8
  ) {
    return (
      <section className="space-insights" aria-label="Đánh giá không gian">
        <h2>Căn này có hợp với bạn?</h2>
        <p role="status">
          Chưa đủ dữ liệu để đánh giá không gian.
          {verification !== "verified" && (
            <> ({floorplanVerificationLabel(verification)})</>
          )}
        </p>
      </section>
    );
  }

  const metrics = computeSpatialMetrics({
    rooms: document.rooms,
    netAreaSqM: document.netAreaSqM,
  });

  if (!metrics.sufficientGeometry) {
    return (
      <section className="space-insights" aria-label="Đánh giá không gian">
        <h2>Căn này có hợp với bạn?</h2>
        <p role="status">Chưa đủ dữ liệu để đánh giá không gian.</p>
      </section>
    );
  }

  const bedrooms = document.rooms.filter((r) => r.type === "bedroom");
  const living = document.rooms.filter((r) => r.type === "living");
  const fits = [
    ...bedrooms.flatMap((r) => evaluateCommonBedroomFits(r)),
    ...living.flatMap((r) => evaluateCommonLivingFits(r)),
  ];
  const comfortable = fits.filter((f) => f.verdict === "comfortable").length;
  const score = computeSpaceScore({
    layoutEfficiencyRatio: metrics.layoutEfficiency,
    bedroomCount: document.bedroomCount ?? bedrooms.length,
    hasStorage: document.rooms.some((r) => r.type === "storage"),
    fitComfortableCount: comfortable,
    fitTotalCount: fits.length,
  });

  return (
    <section className="space-insights" aria-label="Đánh giá không gian">
      <h2>Căn này có hợp với bạn?</h2>
      <dl className="space-insights-grid">
        <div>
          <dt>Diện tích sử dụng</dt>
          <dd>{metrics.usableAreaSqM.toFixed(1)} m²</dd>
        </div>
        <div>
          <dt>Ước lượng lưu thông</dt>
          <dd>{metrics.circulationEstimateSqM.toFixed(1)} m²</dd>
        </div>
        {metrics.layoutEfficiency != null && (
          <div>
            <dt>Hiệu quả mặt bằng</dt>
            <dd>{Math.round(metrics.layoutEfficiency * 100)}%</dd>
          </div>
        )}
        {score && (
          <div>
            <dt>Điểm không gian</dt>
            <dd>{score.overall}/100</dd>
          </div>
        )}
      </dl>

      {metrics.roomAreas.length > 0 && (
        <ul className="space-insights-rooms">
          {metrics.roomAreas.map((room) => (
            <li key={room.roomId}>
              <strong>{room.name ?? room.roomId}</strong>
              <span>{room.areaSqM.toFixed(1)} m²</span>
            </li>
          ))}
        </ul>
      )}

      {fits.length > 0 && (
        <div className="space-insights-fits">
          <h3>Nội thất có vừa không?</h3>
          <ul>
            {fits.slice(0, 6).map((fit) => (
              <li key={`${fit.roomId}-${fit.catalogId}`}>
                <span>{fit.explain}</span>
                <em data-verdict={fit.verdict}>
                  {fit.verdict === "comfortable"
                    ? "Thoải mái"
                    : fit.verdict === "tight"
                      ? "Chật"
                      : "Không vừa"}
                </em>
              </li>
            ))}
          </ul>
        </div>
      )}

      {score && <p className="space-insights-explain">{score.explainVi}</p>}
    </section>
  );
}
