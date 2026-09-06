import type { ProjectDetail } from "../types";
import "./ProjectInfographic.css";

const PENDING = "Chờ xác minh";

function isPending(value: string | undefined): boolean {
  return !value || value === PENDING || value.startsWith("Chờ xác minh");
}

function isSecondaryPrice(value: string): boolean {
  return value.includes("thứ cấp") || value.includes("Tham chiếu TT");
}

type Metric = {
  label: string;
  value: string;
  fill: number;
  tone: "ok" | "warn" | "pending" | "secondary";
};

function buildMetrics(project: ProjectDetail): Metric[] {
  const aptCount = project.apartmentTypes.length;
  const amenityCount = project.amenities.length;
  const mediaCount = project.media?.length ?? 0;
  const atlasCount = project.media?.filter((m) => m.kind === "atlas").length ?? 0;
  const docVerified =
    project.documents?.filter((d) => d.status === "verified").length ?? 0;
  const handoverDone =
    project.handoverUnits?.filter((u) => u.status === "handed_over").length ?? 0;

  const facts = [
    project.address,
    project.handover,
    project.totalUnits,
    project.priceRange,
  ];
  const verifiedFacts = facts.filter((f) => !isPending(f)).length;
  const factFill = verifiedFacts / facts.length;

  const priceTone: Metric["tone"] = isPending(project.priceRange)
    ? "pending"
    : isSecondaryPrice(project.priceRange)
      ? "secondary"
      : "ok";

  return [
    {
      label: "Trường đã xác minh",
      value: `${verifiedFacts}/${facts.length}`,
      fill: factFill,
      tone: factFill >= 0.75 ? "ok" : factFill >= 0.4 ? "warn" : "pending",
    },
    {
      label: "Loại căn",
      value: String(aptCount),
      fill: Math.min(1, aptCount / 4),
      tone: aptCount > 0 ? "ok" : "pending",
    },
    {
      label: "Tiện ích",
      value: String(amenityCount),
      fill: Math.min(1, amenityCount / 6),
      tone: amenityCount > 0 ? "ok" : "pending",
    },
    {
      label: "Atlas / media",
      value: atlasCount > 0 ? `${atlasCount} atlas · ${mediaCount} mục` : `${mediaCount} mục`,
      fill: Math.min(1, (atlasCount + mediaCount) / 4),
      tone: atlasCount > 0 ? "warn" : mediaCount > 0 ? "ok" : "pending",
    },
    {
      label: "Tài liệu verified",
      value: String(docVerified),
      fill: Math.min(1, docVerified / 3),
      tone: docVerified > 0 ? "ok" : "pending",
    },
    {
      label: "Phân khu đã bàn giao",
      value: String(handoverDone),
      fill: Math.min(1, handoverDone / 2),
      tone: handoverDone > 0 ? "ok" : "pending",
    },
    {
      label: "Giá",
      value: isPending(project.priceRange)
        ? PENDING
        : isSecondaryPrice(project.priceRange)
          ? "Tham chiếu thứ cấp"
          : "Có dữ liệu",
      fill: isPending(project.priceRange)
        ? 0.15
        : isSecondaryPrice(project.priceRange)
          ? 0.55
          : 0.9,
      tone: priceTone,
    },
  ];
}

type ProjectInfographicProps = {
  project: ProjectDetail;
};

export function ProjectInfographic({ project }: ProjectInfographicProps) {
  const metrics = buildMetrics(project);
  const confidencePct =
    project.confidence != null ? Math.round(project.confidence * 100) : null;

  return (
    <section className="project-infographic" aria-label="Infographic dự án">
      <header className="project-infographic-head">
        <div>
          <p className="project-infographic-eyebrow">{project.developerName}</p>
          <h2>Infographic — {project.name}</h2>
          <p>
            Chỉ hiển thị trường đã có nguồn công khai. Giá CĐT thiếu thì giữ「Chờ xác minh」;
            tham chiếu thứ cấp được gắn nhãn riêng.
          </p>
        </div>
        {confidencePct != null && (
          <div
            className="project-infographic-confidence"
            style={{ ["--fill" as string]: `${confidencePct}%` }}
            aria-label={`Độ tin cậy ${confidencePct}%`}
          >
            <span>{confidencePct}%</span>
            <small>tin cậy</small>
          </div>
        )}
      </header>

      <ul className="project-infographic-metrics">
        {metrics.map((m) => (
          <li key={m.label} className={`tone-${m.tone}`}>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value">{m.value}</div>
            <div
              className="metric-bar"
              role="presentation"
              style={{ ["--fill" as string]: `${Math.round(m.fill * 100)}%` }}
            />
          </li>
        ))}
      </ul>

      <div className="project-infographic-price">
        <h3>Giá</h3>
        <p className={isPending(project.priceRange) ? "pending-data" : ""}>
          {project.priceRange}
        </p>
        {project.priceProvenance && (
          <p className="provenance">Nguồn giá: {project.priceProvenance}</p>
        )}
      </div>

      {project.apartmentTypes.length > 0 && (
        <div className="project-infographic-types">
          <h3>Cơ cấu loại căn</h3>
          <ul>
            {project.apartmentTypes.map((apt) => {
              const beds = apt.bedrooms ?? 0;
              const width = Math.min(100, 28 + beds * 18);
              return (
                <li key={apt.id}>
                  <span className="type-name">{apt.name}</span>
                  <span
                    className="type-bar"
                    style={{ ["--fill" as string]: `${width}%` }}
                    aria-hidden
                  />
                  <span className={isPending(apt.areaSqm) ? "pending-data" : ""}>
                    {apt.areaSqm}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
