import { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import type {
  Fixture,
  FloorPlanDocument,
  FurnitureInstance,
  MaterialPalette,
  Wall,
} from "@ancu/shared";
import {
  fixtureColor,
  fixtureSize,
  roomCentroid,
  wallRotation,
} from "./utils";
import {
  buildFurnitureDef,
  furnitureStyleFromPaletteLabel,
  type FurnitureStyle,
} from "./furnitureCatalog";
import {
  planWallMeshes,
  spanCenter,
  type WallMeshPlan,
  type WallOpening,
} from "./wallExtrusion";

function WallSolids({ plan, color }: { plan: WallMeshPlan; color: string }) {
  const rotation = wallRotation(plan.wall);
  return (
    <group>
      {plan.solids.map((seg, i) => {
        const length = seg.endM - seg.startM;
        const height = seg.y1 - seg.y0;
        const [cx, , cz] = spanCenter(plan.wall, seg.startM, seg.endM, (seg.y0 + seg.y1) / 2);
        return (
          <mesh
            key={`${plan.wall.id}-s${i}`}
            position={[cx, (seg.y0 + seg.y1) / 2, cz]}
            rotation={[0, -rotation, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[length, height, plan.wall.thicknessM]} />
            <meshStandardMaterial
              color={color}
              roughness={plan.wall.exterior ? 0.85 : 0.75}
              metalness={0.02}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function DoorLeaf({
  wall,
  opening,
}: {
  wall: Wall;
  opening: Extract<WallOpening, { kind: "door" }>;
}) {
  const rotation = wallRotation(wall);
  const width = opening.endM - opening.startM;
  const thickness = 0.04;
  const hingeOffset =
    opening.swing === "right" ? width / 2 - thickness / 2 : -(width / 2 - thickness / 2);
  const [cx, , cz] = spanCenter(wall, opening.startM, opening.endM, opening.heightM / 2);
  const openAngle =
    opening.swing === "sliding" || opening.swing === "unknown"
      ? 0
      : opening.swing === "left"
        ? Math.PI / 2.4
        : -Math.PI / 2.4;

  return (
    <group position={[cx, 0, cz]} rotation={[0, -rotation, 0]}>
      <group position={[hingeOffset, 0, 0]} rotation={[0, openAngle, 0]}>
        <mesh
          position={[
            opening.swing === "right" ? -width / 2 + thickness / 2 : width / 2 - thickness / 2,
            opening.heightM / 2,
            0,
          ]}
          castShadow
        >
          <boxGeometry args={[width - 0.02, opening.heightM - 0.02, thickness]} />
          <meshStandardMaterial color="#8b6914" roughness={0.55} metalness={0.08} />
        </mesh>
      </group>
      <mesh position={[-width / 2, opening.heightM / 2, 0]}>
        <boxGeometry args={[0.04, opening.heightM, wall.thicknessM + 0.02]} />
        <meshStandardMaterial color="#6b5a45" roughness={0.7} />
      </mesh>
      <mesh position={[width / 2, opening.heightM / 2, 0]}>
        <boxGeometry args={[0.04, opening.heightM, wall.thicknessM + 0.02]} />
        <meshStandardMaterial color="#6b5a45" roughness={0.7} />
      </mesh>
    </group>
  );
}

function WindowPane({
  wall,
  opening,
}: {
  wall: Wall;
  opening: Extract<WallOpening, { kind: "window" }>;
}) {
  const rotation = wallRotation(wall);
  const width = opening.endM - opening.startM;
  const y = opening.sillHeightM + opening.heightM / 2;
  const [cx, , cz] = spanCenter(wall, opening.startM, opening.endM, y);

  return (
    <group position={[cx, y, cz]} rotation={[0, -rotation, 0]}>
      <mesh>
        <boxGeometry args={[width, opening.heightM, wall.thicknessM * 0.35]} />
        <meshStandardMaterial color="#a8b0b5" roughness={0.4} metalness={0.35} />
      </mesh>
      <mesh>
        <boxGeometry args={[width - 0.06, opening.heightM - 0.06, 0.03]} />
        <meshPhysicalMaterial
          color="#cfe8f5"
          transparent
          opacity={0.35}
          roughness={0.08}
          metalness={0.05}
          transmission={0.55}
          thickness={0.02}
        />
      </mesh>
    </group>
  );
}

function FurnitureMesh({
  item,
  style = "modern",
}: {
  item: FurnitureInstance;
  style?: FurnitureStyle;
}) {
  const [x, z] = item.position;
  const def = buildFurnitureDef(item.catalogId, style);
  const scale = item.scale ?? 1;
  return (
    <group position={[x, 0, z]} rotation={[0, item.rotationRad, 0]} scale={scale}>
      {def.parts.map((part, index) => (
        <mesh key={`${item.id}-p${index}`} position={part.position} castShadow receiveShadow>
          <boxGeometry args={part.size} />
          <meshStandardMaterial color={part.color} roughness={0.65} metalness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

function FixtureMesh({ item }: { item: Fixture }) {
  const [x, z] = item.position;
  const [w, h, d] = fixtureSize(item.type);
  return (
    <mesh
      position={[x, h / 2, z]}
      rotation={[0, item.rotationRad, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={fixtureColor(item.type)} roughness={0.45} metalness={0.15} />
    </mesh>
  );
}

function RoomFloor({
  polygon,
  opacity,
  color = "#d4ebe8",
  thickness = 0.08,
}: {
  polygon: [number, number][];
  opacity: number;
  color?: string;
  thickness?: number;
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    if (polygon.length > 0) {
      shape.moveTo(polygon[0][0], -polygon[0][1]);
      for (let i = 1; i < polygon.length; i++) {
        shape.lineTo(polygon[i][0], -polygon[i][1]);
      }
      shape.closePath();
    }
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: false,
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [polygon, thickness]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        color={color}
        transparent={opacity < 0.99}
        opacity={opacity}
        roughness={0.9}
        metalness={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function RoomCeiling({
  polygon,
  heightM,
  visible,
}: {
  polygon: [number, number][];
  heightM: number;
  visible: boolean;
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    if (polygon.length > 0) {
      shape.moveTo(polygon[0][0], -polygon[0][1]);
      for (let i = 1; i < polygon.length; i++) {
        shape.lineTo(polygon[i][0], -polygon[i][1]);
      }
      shape.closePath();
    }
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [polygon]);

  if (!visible) return null;

  return (
    <mesh geometry={geometry} position={[0, heightM - 0.03, 0]}>
      <meshStandardMaterial
        color="#f7f4ef"
        transparent
        opacity={0.55}
        roughness={0.95}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function RoomLabel({
  name,
  polygon,
  visible,
}: {
  name: string;
  polygon: [number, number][];
  visible: boolean;
}) {
  if (!visible) return null;
  const [x, z] = roomCentroid(polygon);
  return (
    <Text
      position={[x, 2.5, z]}
      rotation={[-Math.PI / 2, 0, 0]}
      fontSize={0.25}
      color="#14524e"
      anchorX="center"
      anchorY="middle"
    >
      {name}
    </Text>
  );
}

interface FloorPlanSceneProps {
  document: FloorPlanDocument;
  showFurniture: boolean;
  showLabels: boolean;
  showCeilings?: boolean;
  focusRoomId?: string;
  roomOverlayOpacity: number;
  materialPalette?: MaterialPalette;
  groundColor?: string;
}

export function FloorPlanScene({
  document,
  showFurniture,
  showLabels,
  showCeilings = false,
  focusRoomId,
  roomOverlayOpacity,
  materialPalette,
  groundColor = "#f5f0ea",
}: FloorPlanSceneProps) {
  const wallColor = materialPalette?.wall ?? "#e8e2d8";
  const floorColor = materialPalette?.floor ?? "#d4ebe8";

  const wallPlans = useMemo(
    () => planWallMeshes(document.walls, document.doors, document.windows),
    [document.walls, document.doors, document.windows],
  );

  const defaultWallHeight = document.walls[0]?.heightM ?? 2.8;

  const visibleRooms = focusRoomId
    ? document.rooms.filter((r) => r.id === focusRoomId)
    : document.rooms;

  const visibleFurniture = showFurniture
    ? document.furniture.filter((f) => (focusRoomId ? f.roomId === focusRoomId : true))
    : [];

  const visibleFixtures = showFurniture
    ? document.fixtures.filter((f) => (focusRoomId ? f.roomId === focusRoomId : true))
    : [];

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={groundColor} roughness={1} />
      </mesh>

      {wallPlans.map((plan) => (
        <group key={plan.wall.id}>
          <WallSolids plan={plan} color={wallColor} />
          {plan.openings.map((opening) =>
            opening.kind === "door" ? (
              <DoorLeaf key={opening.id} wall={plan.wall} opening={opening} />
            ) : (
              <WindowPane key={opening.id} wall={plan.wall} opening={opening} />
            ),
          )}
        </group>
      ))}

      {visibleRooms.map((room) => (
        <group key={room.id}>
          <RoomFloor
            polygon={room.polygon}
            opacity={Math.max(roomOverlayOpacity, 0.85)}
            color={floorColor}
          />
          <RoomCeiling
            polygon={room.polygon}
            heightM={defaultWallHeight}
            visible={showCeilings}
          />
        </group>
      ))}

      {visibleFurniture.map((item) => (
        <FurnitureMesh
          key={item.id}
          item={item}
          style={furnitureStyleFromPaletteLabel(materialPalette?.label)}
        />
      ))}

      {visibleFixtures.map((item) => (
        <FixtureMesh key={item.id} item={item} />
      ))}

      {document.rooms.map((room) => (
        <RoomLabel
          key={`label-${room.id}`}
          name={room.name}
          polygon={room.polygon}
          visible={showLabels && (!focusRoomId || room.id === focusRoomId)}
        />
      ))}
    </group>
  );
}
