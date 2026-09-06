import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import type { FloorPlanDocument, ViewerMode } from "../types";
import { documentBounds, hasWebGL } from "./utils";
import { FloorPlanScene } from "./FloorPlanScene";
import "./FloorPlanViewer.css";

interface FloorPlanViewerProps {
  document: FloorPlanDocument;
  mode: ViewerMode;
  showFurniture: boolean;
  showLabels: boolean;
  focusRoomId?: string;
  roomOverlayOpacity: number;
}

function CameraRig({ mode, bounds }: { mode: ViewerMode; bounds: ReturnType<typeof documentBounds> }) {
  const { cx, cz, size } = bounds;
  const dist = size * 1.8;

  if (mode === "top") {
    return (
      <PerspectiveCamera makeDefault position={[cx, dist, cz + 0.01]} rotation={[-Math.PI / 2, 0, 0]} fov={50} />
    );
  }

  if (mode === "perspective") {
    return (
      <PerspectiveCamera
        makeDefault
        position={[cx + dist * 0.6, dist * 0.5, cz + dist * 0.6]}
        fov={45}
      />
    );
  }

  // dollhouse — angled overview
  return (
    <PerspectiveCamera
      makeDefault
      position={[cx + dist * 0.5, dist * 0.7, cz + dist * 0.5]}
      fov={40}
    />
  );
}

function ViewerControls({
  mode,
  onModeChange,
  showFurniture,
  onFurnitureToggle,
  showLabels,
  onLabelsToggle,
  rooms,
  focusRoomId,
  onRoomFocus,
}: {
  mode: ViewerMode;
  onModeChange: (m: ViewerMode) => void;
  showFurniture: boolean;
  onFurnitureToggle: () => void;
  showLabels: boolean;
  onLabelsToggle: () => void;
  rooms: { id: string; name: string }[];
  focusRoomId?: string;
  onRoomFocus: (id?: string) => void;
}) {
  return (
    <div className="viewer-controls">
      <div className="viewer-control-group">
        <span className="control-label">Chế độ</span>
        {(["dollhouse", "top", "perspective"] as ViewerMode[]).map((m) => (
          <button
            key={m}
            type="button"
            className={`btn btn-ghost ${mode === m ? "active" : ""}`}
            onClick={() => onModeChange(m)}
          >
            {m === "dollhouse" ? "Dollhouse" : m === "top" ? "Trên" : "Góc nhìn"}
          </button>
        ))}
      </div>
      <div className="viewer-control-group">
        <button type="button" className="btn btn-ghost" onClick={onFurnitureToggle}>
          {showFurniture ? "Ẩn nội thất" : "Hiện nội thất"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onLabelsToggle}>
          {showLabels ? "Ẩn nhãn" : "Hiện nhãn"}
        </button>
      </div>
      <div className="viewer-control-group">
        <label className="control-label" htmlFor="room-focus">Phòng</label>
        <select
          id="room-focus"
          value={focusRoomId ?? ""}
          onChange={(e) => onRoomFocus(e.target.value || undefined)}
        >
          <option value="">Tất cả</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener("change", onChange);
    setMatches(mq.matches);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

export function FloorPlanViewer({
  document,
  mode,
  showFurniture,
  showLabels,
  focusRoomId,
  roomOverlayOpacity,
}: FloorPlanViewerProps) {
  const bounds = documentBounds(document);
  const webgl = hasWebGL();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const dprMax = isMobile
    ? 1.25
    : Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio : 1);

  if (!webgl) {
    return (
      <div className="viewer-fallback" role="alert">
        <p>Trình duyệt không hỗ trợ WebGL. Không thể hiển thị mặt bằng 3D.</p>
        <p>Vui lòng dùng trình duyệt hiện đại hoặc bật phần cứng đồ họa.</p>
      </div>
    );
  }

  return (
    <div className="viewer-canvas-wrap">
      <Canvas shadows={!isMobile} dpr={[1, dprMax]}>
        <Suspense fallback={null}>
          <CameraRig mode={mode} bounds={bounds} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 15, 8]} intensity={0.8} castShadow={!isMobile} />
          <FloorPlanScene
            document={document}
            showFurniture={showFurniture}
            showLabels={showLabels}
            focusRoomId={focusRoomId}
            roomOverlayOpacity={roomOverlayOpacity}
          />
          <OrbitControls
            target={[bounds.cx, 1, bounds.cz]}
            maxPolarAngle={mode === "top" ? 0.01 : Math.PI / 2.1}
            minPolarAngle={mode === "top" ? 0 : 0.2}
            enablePan
            enableDamping={!reducedMotion}
            rotateSpeed={0.9}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export function FloorPlanViewerWithControls({ document }: { document: FloorPlanDocument }) {
  const [mode, setMode] = useState<ViewerMode>("dollhouse");
  const [showFurniture, setShowFurniture] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [focusRoomId, setFocusRoomId] = useState<string | undefined>();
  const [roomOverlayOpacity, setRoomOverlayOpacity] = useState(0.35);

  return (
    <div className="viewer-panel">
      <ViewerControls
        mode={mode}
        onModeChange={setMode}
        showFurniture={showFurniture}
        onFurnitureToggle={() => setShowFurniture((v) => !v)}
        showLabels={showLabels}
        onLabelsToggle={() => setShowLabels((v) => !v)}
        rooms={document.rooms}
        focusRoomId={focusRoomId}
        onRoomFocus={setFocusRoomId}
      />
      <FloorPlanViewer
        document={document}
        mode={mode}
        showFurniture={showFurniture}
        showLabels={showLabels}
        focusRoomId={focusRoomId}
        roomOverlayOpacity={roomOverlayOpacity}
      />
      <div className="viewer-opacity-control">
        <label htmlFor="overlay-opacity">
          Độ mờ phòng (QA): {Math.round(roomOverlayOpacity * 100)}%
        </label>
        <input
          id="overlay-opacity"
          type="range"
          min={0}
          max={100}
          value={roomOverlayOpacity * 100}
          onChange={(e) => setRoomOverlayOpacity(Number(e.target.value) / 100)}
        />
      </div>
    </div>
  );
}
