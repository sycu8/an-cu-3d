import { useMemo } from "react";
import * as THREE from "three";
import { Box, Text } from "@react-three/drei";
import type {
  Fixture,
  FloorPlanDocument,
  FurnitureInstance,
  MaterialPalette,
  Wall,
} from "@ancu/shared";
import {
  catalogSize,
  fixtureColor,
  fixtureSize,
  furnitureColor,
  roomCentroid,
  wallCenter,
  wallLength,
  wallRotation,
} from "./utils";

function WallMesh({ wall, color }: { wall: Wall; color: string }) {
  const length = wallLength(wall);
  const [cx, cy, cz] = wallCenter(wall);
  const rotation = wallRotation(wall);

  return (
    <Box
      position={[cx, cy, cz]}
      rotation={[0, -rotation, 0]}
      args={[length, wall.heightM, wall.thicknessM]}
    >
      <meshStandardMaterial color={color} />
    </Box>
  );
}

function FurnitureMesh({ item }: { item: FurnitureInstance }) {
  const [x, z] = item.position;
  const [w, h, d] = catalogSize(item.catalogId);
  const scale = item.scale ?? 1;
  return (
    <Box
      position={[x, h / 2, z]}
      rotation={[0, item.rotationRad, 0]}
      args={[w * scale, h * scale, d * scale]}
    >
      <meshStandardMaterial color={furnitureColor(item.catalogId)} />
    </Box>
  );
}

function FixtureMesh({ item }: { item: Fixture }) {
  const [x, z] = item.position;
  const [w, h, d] = fixtureSize(item.type);
  return (
    <Box
      position={[x, h / 2, z]}
      rotation={[0, item.rotationRad, 0]}
      args={[w, h, d]}
    >
      <meshStandardMaterial color={fixtureColor(item.type)} />
    </Box>
  );
}

function RoomFloor({
  polygon,
  opacity,
  color = "#d4ebe8",
}: {
  polygon: [number, number][];
  opacity: number;
  color?: string;
}) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    if (polygon.length > 0) {
      s.moveTo(polygon[0][0], polygon[0][1]);
      for (let i = 1; i < polygon.length; i++) {
        s.lineTo(polygon[i][0], polygon[i][1]);
      }
      s.closePath();
    }
    return s;
  }, [polygon]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={opacity}
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
  focusRoomId?: string;
  roomOverlayOpacity: number;
  materialPalette?: MaterialPalette;
  groundColor?: string;
}

export function FloorPlanScene({
  document,
  showFurniture,
  showLabels,
  focusRoomId,
  roomOverlayOpacity,
  materialPalette,
  groundColor = "#f5f0ea",
}: FloorPlanSceneProps) {
  const wallColor = materialPalette?.wall ?? "#e8e2d8";
  const floorColor = materialPalette?.floor ?? "#d4ebe8";

  const visibleRooms = focusRoomId
    ? document.rooms.filter((r) => r.id === focusRoomId)
    : document.rooms;

  const visibleFurniture = showFurniture
    ? document.furniture.filter((f) =>
        focusRoomId ? f.roomId === focusRoomId : true,
      )
    : [];

  const visibleFixtures = showFurniture
    ? document.fixtures.filter((f) =>
        focusRoomId ? f.roomId === focusRoomId : true,
      )
    : [];

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={groundColor} />
      </mesh>

      {document.walls.map((wall) => (
        <WallMesh key={wall.id} wall={wall} color={wallColor} />
      ))}

      {visibleRooms.map((room) => (
        <RoomFloor
          key={room.id}
          polygon={room.polygon}
          opacity={roomOverlayOpacity}
          color={floorColor}
        />
      ))}

      {visibleFurniture.map((item) => (
        <FurnitureMesh key={item.id} item={item} />
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
