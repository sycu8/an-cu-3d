import { lazy, Suspense, useState } from "react";
import { Link, useParams } from "react-router";
import { PageSkeleton } from "../components/PageSkeleton";
import { useProject } from "../hooks/useProjects";
import { getSampleFloorPlan } from "../data/sample-floorplans";
import { qaMetadata } from "../viewer/utils";
import { QaPanel } from "../viewer/QaPanel";
import "../viewer/QaPanel.css";

const FloorPlanViewerWithControls = lazy(() =>
  import("../viewer/FloorPlanViewer").then((m) => ({
    default: m.FloorPlanViewerWithControls,
  })),
);

export default function ApartmentViewerPage() {
  const { slug, unit } = useParams<{ slug: string; unit: string }>();
  const state = useProject(slug);
  const [overlayOpacity, setOverlayOpacity] = useState(0.35);

  if (state.status === "loading") return <PageSkeleton />;

  if (state.status === "error" || !state.data) {
    return (
      <div className="container page-header">
        <h1>Không tìm thấy căn hộ</h1>
        <p role="alert">{state.status === "error" ? state.error : "Missing project"}</p>
        <Link to={slug ? `/projects/${slug}/apartments` : "/projects"}>← Quay lại</Link>
      </div>
    );
  }

  const project = state.data;
  const apt = project.apartmentTypes.find((a) => a.slug === unit);
  const floorPlanKey = apt?.floorplanKey ?? unit;
  const floorPlan = floorPlanKey ? getSampleFloorPlan(floorPlanKey) : null;
  const floorMeta = floorPlan ? qaMetadata(floorPlan) : null;

  if (!apt || !floorPlan) {
    return (
      <div className="container page-header">
        <h1>Không tìm thấy căn hộ</h1>
        <Link to={`/projects/${project.slug}/apartments`}>← Quay lại</Link>
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
          <span className={apt.areaSqm === "Chờ xác minh" ? "pending-data" : ""}>
            {apt.areaSqm}
          </span>
        </p>
        {apt.provenance && <p className="provenance">Nguồn: {apt.provenance}</p>}
        {apt.confidence != null && (
          <p className="apt-meta">
            Tin cậy dữ liệu căn: <strong>{Math.round(apt.confidence * 100)}%</strong>
          </p>
        )}
        {apt.validationSummary && (
          <p className="apt-meta validation-summary">{apt.validationSummary}</p>
        )}
        {floorMeta?.validationSummary && (
          <p className="apt-meta">
            Kiểm tra mặt bằng: {floorMeta.validationSummary}
            {floorMeta.confidence != null && (
              <> · Tin cậy mặt bằng: <strong>{Math.round(floorMeta.confidence * 100)}%</strong></>
            )}
          </p>
        )}
      </header>

      <p className="viewer-hint">
        Kéo để xoay · cuộn để phóng to · giữ Shift và kéo để di chuyển góc nhìn
      </p>

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
