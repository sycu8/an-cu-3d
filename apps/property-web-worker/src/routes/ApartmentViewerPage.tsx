import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  DEFAULT_MATERIAL_PALETTES,
  filterProjectMedia,
  isUnitViewMode,
  type LightingPreset,
  type MaterialPalette,
  type UnitViewMode,
} from "@ancu/shared";
import { AutoComposePanel } from "../components/AutoComposePanel";
import { MediaGallery } from "../components/MediaGallery";
import { PageSkeleton } from "../components/PageSkeleton";
import { ViewModeBar } from "../components/ViewModeBar";
import { useProject } from "../hooks/useProjects";
import { getSampleFloorPlan } from "../data/sample-floorplans";
import { qaMetadata } from "../viewer/utils";
import { QaPanel } from "../viewer/QaPanel";
import "../viewer/QaPanel.css";
import "./ApartmentViewerPage.css";

const FloorPlanViewer = lazy(() =>
  import("../viewer/FloorPlanViewer").then((m) => ({ default: m.FloorPlanViewer })),
);

const FloorPlanViewerWithControls = lazy(() =>
  import("../viewer/FloorPlanViewer").then((m) => ({
    default: m.FloorPlanViewerWithControls,
  })),
);

export default function ApartmentViewerPage() {
  const { slug, unit } = useParams<{ slug: string; unit: string }>();
  const [params, setParams] = useSearchParams();
  const state = useProject(slug);
  const [overlayOpacity, setOverlayOpacity] = useState(0.35);
  const [autoCycling, setAutoCycling] = useState(true);
  const [lighting, setLighting] = useState<LightingPreset>("day");
  const [paletteLabel, setPaletteLabel] = useState(DEFAULT_MATERIAL_PALETTES[0]!.label);

  const viewMode: UnitViewMode = useMemo(() => {
    const raw = params.get("view");
    return isUnitViewMode(raw) ? raw : "3d";
  }, [params]);

  const palette: MaterialPalette = useMemo(
    () =>
      DEFAULT_MATERIAL_PALETTES.find((p) => p.label === paletteLabel) ??
      DEFAULT_MATERIAL_PALETTES[0]!,
    [paletteLabel],
  );

  function setViewMode(mode: UnitViewMode) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (mode === "3d") next.delete("view");
      else next.set("view", mode);
      return next;
    });
  }

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
  const media = project.media ?? [];
  const floorplan2d = filterProjectMedia(media, "floorplan_2d", unit);
  const perspectives = filterProjectMedia(media, "perspective", unit);

  if (!apt || !floorPlan) {
    return (
      <div className="container page-header">
        <h1>Không tìm thấy căn hộ</h1>
        <Link to={`/projects/${project.slug}/apartments`}>← Quay lại</Link>
      </div>
    );
  }

  const show3d = viewMode === "3d" || viewMode === "auto";
  const showMedia = viewMode === "2d" || viewMode === "perspective";
  const galleryItems = viewMode === "2d" ? floorplan2d : perspectives;
  const galleryEmpty =
    viewMode === "2d"
      ? "Chưa có mặt bằng 2D đã xác minh cho căn này."
      : "Chưa có phối cảnh đã xác minh cho căn này.";

  return (
    <div className="container apartment-viewer-page">
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

      <ViewModeBar
        value={viewMode}
        onChange={setViewMode}
        counts={{ "2d": floorplan2d.length, perspective: perspectives.length }}
      />

      {showMedia ? (
        <section className="apartment-media" aria-label="Thư viện hình ảnh">
          <MediaGallery items={galleryItems} emptyLabel={galleryEmpty} />
          <p className="apartment-media-note">
            Ảnh minh họa — chờ xác minh trước khi dùng làm căn cứ bán hàng.
          </p>
        </section>
      ) : null}

      {show3d && viewMode === "3d" ? (
        <>
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
        </>
      ) : null}

      {viewMode === "auto" ? (
        <div className="apartment-auto-layout">
          <Suspense fallback={<div className="viewer-fallback">Đang tải 3D…</div>}>
            <FloorPlanViewer
              document={floorPlan}
              mode="perspective"
              showFurniture
              showLabels
              roomOverlayOpacity={overlayOpacity}
              lightingPreset={lighting}
              materialPalette={palette}
            />
          </Suspense>
          <AutoComposePanel
            lighting={lighting}
            palette={palette}
            cycling={autoCycling}
            onCyclingChange={setAutoCycling}
            onLightingChange={setLighting}
            onPaletteChange={setPaletteLabel}
            onOpen3d={() => setViewMode("3d")}
          />
        </div>
      ) : null}

      {viewMode === "3d" && perspectives.length > 0 ? (
        <section className="apartment-side-strip" aria-label="Phối cảnh">
          <div className="apartment-side-strip-head">
            <h2>Phối cảnh</h2>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setViewMode("perspective")}
            >
              Xem tất cả
            </button>
          </div>
          <MediaGallery items={perspectives.slice(0, 4)} emptyLabel="" variant="card" />
        </section>
      ) : null}
    </div>
  );
}
