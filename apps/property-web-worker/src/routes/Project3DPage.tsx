import { lazy, Suspense, useRef } from "react";
import { Link, useParams } from "react-router";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { PageSkeleton } from "../components/PageSkeleton";
import { useProject } from "../hooks/useProjects";
import "./Project3DPage.css";

function BuildingBlock({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <mesh ref={meshRef} position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function SiteScene({ buildingCount }: { buildingCount: number }) {
  const blocks = Array.from({ length: buildingCount }, (_, i) => {
    const angle = (i / buildingCount) * Math.PI * 2;
    const radius = 4;
    return {
      position: [Math.cos(angle) * radius, 2 + i * 0.3, Math.sin(angle) * radius] as [
        number,
        number,
        number,
      ],
      size: [2 + i * 0.3, 4 + i * 0.5, 2 + i * 0.2] as [number, number, number],
      color: i % 2 === 0 ? "#d4ebe8" : "#e8e0d4",
    };
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[8, 12, 6]} intensity={0.7} castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color="#f3ede4" />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[8, 0.6, 6]} />
        <meshStandardMaterial color="#c9bfb2" />
      </mesh>
      {blocks.map((b, i) => (
        <BuildingBlock key={i} position={b.position} size={b.size} color={b.color} />
      ))}
    </>
  );
}

function Project3DCanvas({ buildingCount }: { buildingCount: number }) {
  return (
    <Canvas shadows camera={{ position: [12, 8, 12], fov: 40 }}>
      <Suspense fallback={null}>
        <SiteScene buildingCount={buildingCount} />
        <OrbitControls
          target={[0, 2, 0]}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={6}
          maxDistance={25}
        />
      </Suspense>
    </Canvas>
  );
}

const LazyCanvas = lazy(() =>
  Promise.resolve({ default: Project3DCanvas }),
);

export default function Project3DPage() {
  const { slug } = useParams<{ slug: string }>();
  const state = useProject(slug);

  if (state.status === "loading") return <PageSkeleton />;

  if (state.status === "error" || !state.data) {
    return (
      <div className="container page-header">
        <h1>Không tìm thấy dự án</h1>
        <p role="alert">{state.status === "error" ? state.error : "Missing project"}</p>
        <Link to="/projects">← Quay lại</Link>
      </div>
    );
  }

  const project = state.data;
  const buildingCount = Math.min(project.apartmentTypes.length + 1, 4);

  return (
    <div className="project-3d-page">
      <div className="container">
        <header className="page-header">
          <p>
            <Link to={`/projects/${project.slug}`}>← {project.name}</Link>
          </p>
          <h1>Khám phá 3D — {project.name}</h1>
          <p className="project-3d-note">
            Mô hình khối đơn giản từ dữ liệu dự án — không phải hình ảnh thực tế.
            Chi tiết tòa nhà: Data pending verification.
          </p>
        </header>
      </div>
      <div className="project-3d-canvas">
        <Suspense fallback={<div className="viewer-fallback">Đang tải 3D…</div>}>
          <LazyCanvas buildingCount={buildingCount} />
        </Suspense>
      </div>
      <div className="container project-3d-actions">
        <Link to={`/projects/${project.slug}/apartments`} className="btn btn-primary">
          Xem căn hộ
        </Link>
        <Link to={`/projects/${project.slug}/showroom`} className="btn btn-secondary">
          Showroom
        </Link>
        <Link to={`/map?project=${project.slug}`} className="btn btn-secondary">
          Vị trí
        </Link>
      </div>
    </div>
  );
}
