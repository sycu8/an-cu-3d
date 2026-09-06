import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  DEFAULT_MATERIAL_PALETTES,
  LIGHTING_PRESETS,
  type LightingPreset,
} from "@ancu/shared";
import { getProjectBySlug } from "../data/gamuda-projects";
import { getSampleFloorPlan } from "../data/sample-floorplans";
import "./ShowroomPage.css";

const FloorPlanViewer = lazy(() =>
  import("../viewer/FloorPlanViewer").then((m) => ({ default: m.FloorPlanViewer })),
);

export default function ShowroomPage() {
  const { slug } = useParams<{ slug: string }>();
  const [params, setParams] = useSearchParams();
  const project = slug ? getProjectBySlug(slug) : undefined;

  const unit =
    params.get("unit") ?? project?.apartmentTypes[0]?.slug ?? "studio-a";
  const lighting = ((params.get("preset") as LightingPreset) || "day") as LightingPreset;
  const paletteLabel = params.get("palette") ?? DEFAULT_MATERIAL_PALETTES[0].label;
  const palette =
    DEFAULT_MATERIAL_PALETTES.find((p) => p.label === paletteLabel) ??
    DEFAULT_MATERIAL_PALETTES[0];

  const floorPlan = useMemo(() => getSampleFloorPlan(unit), [unit]);
  const [focusRoomId, setFocusRoomId] = useState<string | undefined>();

  if (!project) {
    return (
      <div className="container page-header">
        <h1>Không tìm thấy dự án</h1>
        <Link to="/projects">← Dự án</Link>
      </div>
    );
  }

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next);
  }

  return (
    <div className="showroom-page">
      <div className="container showroom-toolbar">
        <div>
          <p className="showroom-eyebrow">
            <Link to={`/projects/${project.slug}`}>{project.name}</Link> · Nhà mẫu
          </p>
          <h1>Showroom 3D</h1>
          <p>Ánh sáng / vật liệu / điểm dừng phòng — chia sẻ link cho khách hàng.</p>
        </div>
        <div className="showroom-controls">
          <label>
            Căn
            <select value={unit} onChange={(e) => setParam("unit", e.target.value)}>
              {project.apartmentTypes.map((a) => (
                <option key={a.slug} value={a.slug}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ánh sáng
            <select value={lighting} onChange={(e) => setParam("preset", e.target.value)}>
              {(Object.keys(LIGHTING_PRESETS) as LightingPreset[]).map((key) => (
                <option key={key} value={key}>
                  {LIGHTING_PRESETS[key].label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Vật liệu
            <select value={palette.label} onChange={(e) => setParam("palette", e.target.value)}>
              {DEFAULT_MATERIAL_PALETTES.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="showroom-hotspots container">
        {floorPlan.rooms.map((room, index) => (
          <button
            key={room.id}
            type="button"
            className={focusRoomId === room.id ? "active" : ""}
            onClick={() =>
              setFocusRoomId((cur) => (cur === room.id ? undefined : room.id))
            }
          >
            {index + 1}. {room.name}
          </button>
        ))}
      </div>

      <Suspense fallback={<div className="container">Đang tải 3D…</div>}>
        <FloorPlanViewer
          document={floorPlan}
          mode="dollhouse"
          showFurniture
          showLabels
          focusRoomId={focusRoomId}
          roomOverlayOpacity={0.35}
          lightingPreset={lighting}
          materialPalette={palette}
        />
      </Suspense>
    </div>
  );
}
