import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  DEFAULT_MATERIAL_PALETTES,
  LIGHTING_PRESETS,
  type LightingPreset,
  type MaterialPalette,
} from "@ancu/shared";
import { PageSkeleton } from "../components/PageSkeleton";
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

  const project = "data" in state ? state.data : undefined;
  const showroom = project?.showroom;

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
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next);
  }

  async function copyShareLink() {
    const url = new URL(window.location.href);
    url.searchParams.set("unit", unit);
    url.searchParams.set("preset", lighting);
    url.searchParams.set("palette", paletteLabel);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="showroom-page">
      <div className="container showroom-toolbar">
        <div>
          <p className="showroom-eyebrow">
            <Link to={`/projects/${project.slug}`}>{project.name}</Link> · Nhà mẫu
          </p>
          <h1>Showroom 3D</h1>
          <p>
            Ánh sáng / vật liệu / điểm dừng phòng — chia sẻ link cho khách hàng.
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
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void copyShareLink()}
          >
            {copied ? "Đã copy link" : "Copy link showroom"}
          </button>
        </div>
      </div>

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

      {photoMaterial?.notes && paletteLabel === "from-photo" && (
        <p className="container showroom-photo-note">{photoMaterial.notes}</p>
      )}

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
