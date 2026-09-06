import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  DEFAULT_MATERIAL_PALETTES,
  filterProjectMedia,
  isUnitViewMode,
  LIGHTING_PRESETS,
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
import "./ShowroomPage.css";

const FloorPlanViewer = lazy(() =>
  import("../viewer/FloorPlanViewer").then((m) => ({ default: m.FloorPlanViewer })),
);

function matchRoomId(
  rooms: { id: string; name: string }[],
  hint: string,
): string | undefined {
  const h = hint.toLowerCase();
  return rooms.find(
    (r) =>
      r.id.toLowerCase().includes(h) ||
      r.name.toLowerCase().includes(h) ||
      h.includes(r.id.toLowerCase()),
  )?.id;
}

export default function ShowroomPage() {
  const { slug } = useParams<{ slug: string }>();
  const [params, setParams] = useSearchParams();
  const state = useProject(slug);
  const [focusRoomId, setFocusRoomId] = useState<string | undefined>();
  const [copied, setCopied] = useState(false);
  const [autoCycling, setAutoCycling] = useState(true);

  const project = "data" in state ? state.data : undefined;
  const showroom = project?.showroom;

  const viewMode: UnitViewMode = useMemo(() => {
    const raw = params.get("view");
    return isUnitViewMode(raw) ? raw : "3d";
  }, [params]);

  const unit =
    params.get("unit") ?? project?.apartmentTypes[0]?.slug ?? "studio-a";

  const defaultLighting =
    (showroom?.lightingDefault as LightingPreset | undefined) ?? "day";
  const lighting = ((params.get("preset") as LightingPreset) ||
    defaultLighting) as LightingPreset;

  const defaultPaletteLabel =
    showroom?.materialPaletteLabel ?? DEFAULT_MATERIAL_PALETTES[0].label;
  const paletteLabel = params.get("palette") ?? defaultPaletteLabel;
  const photoMaterial = showroom?.materialFromPhoto;

  const palette: MaterialPalette = useMemo(() => {
    if (paletteLabel === "from-photo" && photoMaterial) {
      return {
        label: "Từ ảnh dự án",
        floor: photoMaterial.floor,
        wall: photoMaterial.wall,
        cabinet: photoMaterial.cabinet,
        accent: photoMaterial.accent,
      };
    }
    return (
      DEFAULT_MATERIAL_PALETTES.find((p) => p.label === paletteLabel) ??
      DEFAULT_MATERIAL_PALETTES[0]
    );
  }, [paletteLabel, photoMaterial]);

  const apt = project?.apartmentTypes.find((a) => a.slug === unit);
  const floorPlanKey = apt?.floorplanKey ?? unit;
  const floorPlan = useMemo(
    () => getSampleFloorPlan(floorPlanKey),
    [floorPlanKey],
  );

  const media = project?.media ?? [];
  const floorplan2d = useMemo(
    () => filterProjectMedia(media, "floorplan_2d", unit),
    [media, unit],
  );
  const perspectives = useMemo(
    () => filterProjectMedia(media, "perspective", unit),
    [media, unit],
  );

  const hotspots = useMemo(() => {
    const configured = [...(showroom?.hotspots ?? [])].sort(
      (a, b) => a.order - b.order,
    );
    if (configured.length) {
      return configured.map((h, index) => ({
        key: `${h.roomHint}-${index}`,
        label: h.label,
        roomId:
          matchRoomId(floorPlan.rooms, h.roomHint) ??
          floorPlan.rooms[index]?.id,
      }));
    }
    return floorPlan.rooms.map((room) => ({
      key: room.id,
      label: room.name,
      roomId: room.id,
    }));
  }, [floorPlan.rooms, showroom?.hotspots]);

  if (state.status === "loading") return <PageSkeleton />;

  if (state.status === "error" || !project) {
    return (
      <div className="container page-header">
        <h1>Không tìm thấy dự án</h1>
        <p role="alert">
          {state.status === "error" ? state.error : "Missing project"}
        </p>
        <Link to="/projects">← Dự án</Link>
      </div>
    );
  }

  function setParam(key: string, value: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(key, value);
      return next;
    });
  }

  function setViewMode(mode: UnitViewMode) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (mode === "3d") next.delete("view");
      else next.set("view", mode);
      return next;
    });
  }

  async function copyShareLink() {
    const url = new URL(window.location.href);
    url.searchParams.set("unit", unit);
    url.searchParams.set("preset", lighting);
    url.searchParams.set("palette", paletteLabel);
    if (viewMode !== "3d") url.searchParams.set("view", viewMode);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const galleryItems = viewMode === "2d" ? floorplan2d : perspectives;
  const galleryEmpty =
    viewMode === "2d"
      ? "Chưa có mặt bằng 2D đã xác minh cho dự án này."
      : "Chưa có phối cảnh đã xác minh cho dự án này.";
  const viewerMode =
    viewMode === "auto"
      ? "perspective"
      : viewMode === "2d"
        ? "top"
        : viewMode === "perspective"
          ? "perspective"
          : "dollhouse";
  const showWebgl =
    viewMode === "3d" || viewMode === "auto" || viewMode === "2d" || viewMode === "perspective";

  return (
    <div className="showroom-page">
      <div className="container showroom-toolbar">
        <div>
          <p className="showroom-eyebrow">
            <Link to={`/projects/${project.slug}`}>{project.name}</Link> · Nhà mẫu
          </p>
          <h1>Showroom</h1>
          <p>
            Mặt bằng WebGL (đùn 2D→3D), phối cảnh, đi bộ trong căn, hoặc tự phối ánh sáng & vật liệu.
          </p>
        </div>
        <div className="showroom-controls">
          <label>
            Căn
            <select
              value={unit}
              onChange={(e) => setParam("unit", e.target.value)}
            >
              {project.apartmentTypes.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          {viewMode === "3d" ? (
            <>
              <label>
                Ánh sáng
                <select
                  value={lighting}
                  onChange={(e) => setParam("preset", e.target.value)}
                >
                  {(Object.keys(LIGHTING_PRESETS) as LightingPreset[]).map((key) => (
                    <option key={key} value={key}>
                      {LIGHTING_PRESETS[key].label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Vật liệu
                <select
                  value={paletteLabel}
                  onChange={(e) => setParam("palette", e.target.value)}
                >
                  {DEFAULT_MATERIAL_PALETTES.map((p) => (
                    <option key={p.label} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                  {photoMaterial && <option value="from-photo">Từ ảnh dự án</option>}
                </select>
              </label>
            </>
          ) : null}
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void copyShareLink()}
          >
            {copied ? "Đã copy link" : "Copy link showroom"}
          </button>
        </div>
      </div>

      <div className="container">
        <ViewModeBar
          value={viewMode}
          onChange={setViewMode}
          counts={{ "2d": floorplan2d.length, perspective: perspectives.length }}
        />
      </div>

      {viewMode === "2d" || viewMode === "perspective" ? (
        <section className="container showroom-media" aria-label="Thư viện hình ảnh">
          <MediaGallery items={galleryItems} emptyLabel={galleryEmpty} />
          <p className="showroom-media-note">
            Ảnh raster minh họa (nếu có) — chờ xác minh từ chủ đầu tư trước khi dùng làm căn cứ bán hàng.
          </p>
        </section>
      ) : null}

      {showWebgl ? (
        <>
          {viewMode === "3d" ? (
            <div className="showroom-hotspots container">
              {hotspots.map((spot, index) => (
                <button
                  key={spot.key}
                  type="button"
                  className={focusRoomId === spot.roomId ? "active" : ""}
                  onClick={() =>
                    setFocusRoomId((cur) =>
                      cur === spot.roomId ? undefined : spot.roomId,
                    )
                  }
                  disabled={!spot.roomId}
                >
                  {index + 1}. {spot.label}
                </button>
              ))}
            </div>
          ) : null}

          {photoMaterial?.notes && paletteLabel === "from-photo" && viewMode === "3d" ? (
            <p className="container showroom-photo-note">{photoMaterial.notes}</p>
          ) : null}

          {viewMode === "2d" || viewMode === "perspective" ? (
            <p className="container viewer-hint">
              {viewMode === "2d"
                ? "Mặt bằng vector được đùn WebGL (tường có cửa/cửa sổ) — cùng nguồn dữ liệu với chế độ 3D."
                : "Phối cảnh WebGL từ mặt bằng 2D đã vector hóa."}
            </p>
          ) : null}

          <div
            className={
              viewMode === "auto" ? "showroom-auto-layout container" : undefined
            }
          >
            <Suspense fallback={<div className="container">Đang tải WebGL…</div>}>
              <FloorPlanViewer
                document={floorPlan}
                mode={viewerMode}
                showFurniture={viewMode !== "2d"}
                showLabels
                focusRoomId={focusRoomId}
                roomOverlayOpacity={viewMode === "2d" ? 0.95 : 0.85}
                lightingPreset={lighting}
                materialPalette={palette}
              />
            </Suspense>

            {viewMode === "auto" ? (
              <AutoComposePanel
                lighting={lighting}
                palette={palette}
                cycling={autoCycling}
                onCyclingChange={setAutoCycling}
                onLightingChange={(preset) => setParam("preset", preset)}
                onPaletteChange={(label) => setParam("palette", label)}
                onOpen3d={() => setViewMode("3d")}
              />
            ) : null}
          </div>

          {viewMode === "3d" && perspectives.length > 0 ? (
            <section className="container showroom-side-strip" aria-label="Phối cảnh nhanh">
              <div className="showroom-side-strip-head">
                <h2>Phối cảnh nhanh</h2>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setViewMode("perspective")}
                >
                  Xem tất cả
                </button>
              </div>
              <MediaGallery
                items={perspectives.slice(0, 4)}
                emptyLabel=""
                variant="card"
              />
            </section>
          ) : null}
        </>
      ) : null}

      <p className="container showroom-disclaimer">
        Giá / diện tích chỉ mang tính minh họa khi dữ liệu chưa xác minh. Ảnh 2D & phối cảnh
        demo là placeholder — thay bằng media chính thức trong Admin khi có.
      </p>
    </div>
  );
}
