import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
import {
  LIGHTING_PRESETS,
  type LightingPreset,
  type MaterialPalette,
} from "@ancu/shared";
import type { FloorPlanDocument, ViewerMode } from "../types";
import { documentBounds, hasWebGL, roomCentroid } from "./utils";
import { FloorPlanScene } from "./FloorPlanScene";
import "./FloorPlanViewer.css";

interface FloorPlanViewerProps {
  document: FloorPlanDocument;
  mode: ViewerMode;
  showFurniture: boolean;
  showLabels: boolean;
  showCeilings?: boolean;
  focusRoomId?: string;
  roomOverlayOpacity: number;
  lightingPreset?: LightingPreset;
  materialPalette?: MaterialPalette;
}

function CameraRig({
  mode,
  bounds,
}: {
  mode: ViewerMode;
  bounds: ReturnType<typeof documentBounds>;
}) {
  const { cx, cz, size } = bounds;
  const dist = Math.max(size * 1.8, 6);
  const orthoZoom = Math.max(18 / Math.max(size, 1), 4);

  if (mode === "top") {
    return (
      <OrthographicCamera
        makeDefault
        position={[cx, dist, cz]}
        zoom={orthoZoom}
        near={0.1}
        far={200}
      />
    );
  }

  if (mode === "walk") {
    return (
      <PerspectiveCamera
        makeDefault
        position={[cx, 1.6, cz + size * 0.35]}
        fov={70}
        near={0.05}
        far={200}
      />
    );
  }

  if (mode === "perspective") {
    return (
      <PerspectiveCamera
        makeDefault
        position={[cx + dist * 0.55, dist * 0.42, cz + dist * 0.55]}
        fov={45}
        near={0.1}
        far={200}
      />
    );
  }

  return (
    <PerspectiveCamera
      makeDefault
      position={[cx + dist * 0.5, dist * 0.7, cz + dist * 0.5]}
      fov={40}
      near={0.1}
      far={200}
    />
  );
}

function WalkController({
  enabled,
  bounds,
  focusPoint,
}: {
  enabled: boolean;
  bounds: ReturnType<typeof documentBounds>;
  focusPoint: [number, number, number];
}) {
  const { camera, gl } = useThree();
  const keys = useRef<Record<string, boolean>>({});
  const yaw = useRef(0);
  const pitch = useRef(0);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };
    const up = (e: PointerEvent) => {
      dragging.current = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };
    const move = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      yaw.current -= dx * 0.004;
      pitch.current = Math.max(-1.1, Math.min(1.1, pitch.current - dy * 0.003));
    };
    const keyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
    };
    const keyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointermove", move);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("pointermove", move);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, [enabled, gl]);

  useFrame((_, dt) => {
    if (!enabled) return;
    const speed = (keys.current.ShiftLeft || keys.current.ShiftRight ? 4.2 : 2.2) * dt;
    const forward = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    const right = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current));
    const pos = camera.position;
    if (keys.current.KeyW || keys.current.ArrowUp) pos.addScaledVector(forward, speed);
    if (keys.current.KeyS || keys.current.ArrowDown) pos.addScaledVector(forward, -speed);
    if (keys.current.KeyA || keys.current.ArrowLeft) pos.addScaledVector(right, -speed);
    if (keys.current.KeyD || keys.current.ArrowRight) pos.addScaledVector(right, speed);

    pos.y = 1.6;
    pos.x = Math.min(bounds.maxX + 1, Math.max(bounds.minX - 1, pos.x));
    pos.z = Math.min(bounds.maxZ + 1, Math.max(bounds.minZ - 1, pos.z));

    const look = new THREE.Vector3(
      pos.x - Math.sin(yaw.current) * Math.cos(pitch.current),
      pos.y + Math.sin(pitch.current),
      pos.z - Math.cos(yaw.current) * Math.cos(pitch.current),
    );
    camera.lookAt(look);
    void focusPoint;
  });

  return null;
}

function ToneMappingSetup() {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl]);
  return null;
}

const MODE_LABELS: Record<ViewerMode, string> = {
  dollhouse: "Dollhouse",
  top: "Mặt bằng WebGL",
  perspective: "Phối cảnh 3D",
  walk: "Đi bộ",
};

function ViewerControls({
  mode,
  onModeChange,
  showFurniture,
  onFurnitureToggle,
  showLabels,
  onLabelsToggle,
  showCeilings,
  onCeilingsToggle,
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
  showCeilings: boolean;
  onCeilingsToggle: () => void;
  rooms: { id: string; name: string }[];
  focusRoomId?: string;
  onRoomFocus: (id?: string) => void;
}) {
  return (
    <div className="viewer-controls">
      <div className="viewer-control-group">
        <span className="control-label">Chế độ</span>
        {(["dollhouse", "top", "perspective", "walk"] as ViewerMode[]).map((m) => (
          <button
            key={m}
            type="button"
            className={`btn btn-ghost ${mode === m ? "active" : ""}`}
            onClick={() => onModeChange(m)}
          >
            {MODE_LABELS[m]}
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
        <button type="button" className="btn btn-ghost" onClick={onCeilingsToggle}>
          {showCeilings ? "Ẩn trần" : "Hiện trần"}
        </button>
      </div>
      <div className="viewer-control-group">
        <label className="control-label" htmlFor="room-focus">
          Phòng
        </label>
        <select
          id="room-focus"
          value={focusRoomId ?? ""}
          onChange={(e) => onRoomFocus(e.target.value || undefined)}
        >
          <option value="">Tất cả</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      {mode === "walk" ? (
        <p className="viewer-walk-hint">WASD / mũi tên để đi · kéo chuột để nhìn</p>
      ) : null}
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
  showCeilings = false,
  focusRoomId,
  roomOverlayOpacity,
  lightingPreset = "day",
  materialPalette,
}: FloorPlanViewerProps) {
  const bounds = documentBounds(document);
  const webgl = hasWebGL();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const dprMax = isMobile
    ? 1.25
    : Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio : 1);
  const lighting = LIGHTING_PRESETS[lightingPreset];
  const orbitTarget = useMemo<[number, number, number]>(() => {
    if (focusRoomId) {
      const room = document.rooms.find((r) => r.id === focusRoomId);
      if (room) {
        const [x, z] = roomCentroid(room.polygon);
        return [x, 1, z];
      }
    }
    return [bounds.cx, 1, bounds.cz];
  }, [bounds.cx, bounds.cz, document.rooms, focusRoomId]);

  if (!webgl) {
    return (
      <div className="viewer-fallback" role="alert">
        <p>Trình duyệt không hỗ trợ WebGL. Không thể hiển thị mặt bằng 3D.</p>
        <p>Vui lòng dùng trình duyệt hiện đại hoặc bật phần cứng đồ họa.</p>
      </div>
    );
  }

  return (
    <div className="viewer-canvas-wrap" style={{ background: lighting.skyColor }}>
      <Canvas shadows={!isMobile} dpr={[1, dprMax]} gl={{ antialias: true, powerPreference: "high-performance" }}>
        <Suspense fallback={null}>
          <ToneMappingSetup />
          <color attach="background" args={[lighting.skyColor]} />
          <fog attach="fog" args={[lighting.skyColor, bounds.size * 2.5, bounds.size * 6]} />
          <CameraRig mode={mode} bounds={bounds} />
          <ambientLight intensity={lighting.ambient * 0.85} />
          <hemisphereLight
            color={lighting.skyColor}
            groundColor={lighting.groundColor}
            intensity={0.45}
          />
          <directionalLight
            position={[10, 15, 8]}
            intensity={lighting.directional}
            color={lighting.sunColor}
            castShadow={!isMobile}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-far={40}
            shadow-camera-left={-15}
            shadow-camera-right={15}
            shadow-camera-top={15}
            shadow-camera-bottom={-15}
          />
          <FloorPlanScene
            document={document}
            showFurniture={showFurniture}
            showLabels={showLabels}
            showCeilings={showCeilings && mode !== "top"}
            focusRoomId={focusRoomId}
            roomOverlayOpacity={roomOverlayOpacity}
            materialPalette={materialPalette}
            groundColor={lighting.groundColor}
          />
          {!isMobile && mode !== "top" ? (
            <ContactShadows
              position={[0, 0.02, 0]}
              opacity={0.35}
              scale={Math.max(bounds.size * 2.2, 12)}
              blur={2.2}
              far={8}
            />
          ) : null}
          {mode === "walk" ? (
            <WalkController enabled bounds={bounds} focusPoint={orbitTarget} />
          ) : (
            <OrbitControls
              target={orbitTarget}
              maxPolarAngle={mode === "top" ? 0 : Math.PI / 2.05}
              minPolarAngle={mode === "top" ? 0 : 0.15}
              enableRotate={mode !== "top"}
              enablePan
              enableDamping={!reducedMotion}
              rotateSpeed={0.9}
              makeDefault
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}

export function FloorPlanViewerWithControls({ document }: { document: FloorPlanDocument }) {
  const [mode, setMode] = useState<ViewerMode>("dollhouse");
  const [showFurniture, setShowFurniture] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showCeilings, setShowCeilings] = useState(false);
  const [focusRoomId, setFocusRoomId] = useState<string | undefined>();
  const [roomOverlayOpacity, setRoomOverlayOpacity] = useState(0.9);

  return (
    <div className="viewer-panel">
      <ViewerControls
        mode={mode}
        onModeChange={setMode}
        showFurniture={showFurniture}
        onFurnitureToggle={() => setShowFurniture((v) => !v)}
        showLabels={showLabels}
        onLabelsToggle={() => setShowLabels((v) => !v)}
        showCeilings={showCeilings}
        onCeilingsToggle={() => setShowCeilings((v) => !v)}
        rooms={document.rooms}
        focusRoomId={focusRoomId}
        onRoomFocus={setFocusRoomId}
      />
      <FloorPlanViewer
        document={document}
        mode={mode}
        showFurniture={showFurniture}
        showLabels={showLabels}
        showCeilings={showCeilings}
        focusRoomId={focusRoomId}
        roomOverlayOpacity={roomOverlayOpacity}
      />
      <div className="viewer-opacity-control">
        <label htmlFor="overlay-opacity">
          Độ đậm sàn: {Math.round(roomOverlayOpacity * 100)}%
        </label>
        <input
          id="overlay-opacity"
          type="range"
          min={20}
          max={100}
          value={roomOverlayOpacity * 100}
          onChange={(e) => setRoomOverlayOpacity(Number(e.target.value) / 100)}
        />
      </div>
    </div>
  );
}
