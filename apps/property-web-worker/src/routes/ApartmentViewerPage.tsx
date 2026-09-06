import { lazy, Suspense, useState } from "react";
import { Link, useParams } from "react-router";
import { getProjectBySlug } from "../data/gamuda-projects";
import { getSampleFloorPlan } from "../data/sample-floorplans";
import { QaPanel } from "../viewer/QaPanel";
import "../viewer/QaPanel.css";

const FloorPlanViewerWithControls = lazy(() =>
  import("../viewer/FloorPlanViewer").then((m) => ({
    default: m.FloorPlanViewerWithControls,
  })),
);

export default function ApartmentViewerPage() {
  const { slug, unit } = useParams<{ slug: string; unit: string }>();
  const project = slug ? getProjectBySlug(slug) : undefined;
  const apt = project?.apartmentTypes.find((a) => a.slug === unit);
  const floorPlan = unit ? getSampleFloorPlan(unit) : null;
  const [overlayOpacity, setOverlayOpacity] = useState(0.35);

  if (!project || !apt || !floorPlan) {
    return (
      <div className="container page-header">
        <h1>Không tìm thấy căn hộ</h1>
        <Link to={slug ? `/projects/${slug}/apartments` : "/projects"}>← Quay lại</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="page-header">
        <p>
          <Link to={`/projects/${project.slug}/apartments`}>
            ← {project.name}
          </Link>
        </p>
        <h1>{apt.name}</h1>
        <p>
          {apt.bedrooms != null ? `${apt.bedrooms} phòng ngủ` : "—"}
          {apt.bathrooms != null ? ` · ${apt.bathrooms} phòng tắm` : ""}
          {" · "}
          <span className={apt.areaSqm === "Data pending verification" ? "pending-data" : ""}>
            {apt.areaSqm}
          </span>
        </p>
        {apt.provenance && <p className="provenance">Nguồn: {apt.provenance}</p>}
      </header>

      <div className="apartment-viewer-layout">
        <Suspense
          fallback={
            <div className="viewer-fallback">Đang tải trình xem 3D…</div>
          }
        >
          <FloorPlanViewerWithControls document={floorPlan} />
        </Suspense>
        <QaPanel
          document={floorPlan}
          overlayOpacity={overlayOpacity}
          onOverlayOpacityChange={setOverlayOpacity}
        />
      </div>
    </div>
  );
}
