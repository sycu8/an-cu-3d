import type { ProjectSummary } from "../types";
import "./CompareInfographic.css";

const PENDING = "Chờ xác minh";

function fillForPrice(price: string): number {
  if (!price || price === PENDING) return 0.12;
  if (price.includes("thứ cấp") || price.includes("Tham chiếu")) return 0.55;
  return 0.85;
}

function fillForConfidence(c?: number): number {
  return c != null ? Math.max(0.1, Math.min(1, c)) : 0.2;
}

type CompareInfographicProps = {
  projects: ProjectSummary[];
};

/** Compact visual strip for compare page — relative confidence and price completeness. */
export function CompareInfographic({ projects }: CompareInfographicProps) {
  if (projects.length < 2) return null;

  return (
    <section className="compare-infographic" aria-label="Infographic so sánh">
      <header>
        <h2>Infographic so sánh</h2>
        <p>Độ tin cậy và mức đầy đủ giá (CĐT chờ xác minh vs tham chiếu thứ cấp).</p>
      </header>
      <ul>
        {projects.map((p, index) => (
          <li key={p.id} style={{ ["--i" as string]: index }}>
            <div className="compare-infographic-name">{p.name}</div>
            <div className="compare-infographic-row">
              <span>Tin cậy</span>
              <div
                className="compare-infographic-bar tone-teal"
                style={{
                  ["--fill" as string]: `${Math.round(fillForConfidence(p.confidence) * 100)}%`,
                }}
              />
              <em>
                {p.confidence != null ? `${Math.round(p.confidence * 100)}%` : "—"}
              </em>
            </div>
            <div className="compare-infographic-row">
              <span>Giá</span>
              <div
                className="compare-infographic-bar tone-clay"
                style={{
                  ["--fill" as string]: `${Math.round(fillForPrice(p.priceRange) * 100)}%`,
                }}
              />
              <em className={p.priceRange === PENDING ? "pending-data" : ""}>
                {p.priceRange === PENDING
                  ? PENDING
                  : p.priceRange.includes("thứ cấp")
                    ? "Thứ cấp"
                    : "Có dữ liệu"}
              </em>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
