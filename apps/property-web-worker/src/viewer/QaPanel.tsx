import type { FloorPlanDocument } from "@ancu/shared";
import { documentBounds, qaMetadata } from "./utils";
import "./QaPanel.css";

interface QaPanelProps {
  document: FloorPlanDocument;
  overlayOpacity: number;
  onOverlayOpacityChange: (v: number) => void;
}

function boundsFromDoc(doc: FloorPlanDocument) {
  const b = documentBounds(doc);
  return { minX: b.minX - 0.5, minZ: b.minZ - 0.5, maxX: b.maxX + 0.5, maxZ: b.maxZ + 0.5 };
}

export function QaPanel({ document, overlayOpacity, onOverlayOpacityChange }: QaPanelProps) {
  const { minX, minZ, maxX, maxZ } = boundsFromDoc(document);
  const width = maxX - minX;
  const height = maxZ - minZ;

  const toSvg = (x: number, z: number) => {
    const sx = ((x - minX) / width) * 400;
    const sy = ((z - minZ) / height) * 300;
    return [sx, sy] as const;
  };

  const meta = qaMetadata(document);

  return (
    <aside className="qa-panel card">
      <div className="card-body">
        <h3>QA & nguồn dữ liệu</h3>

        {meta.sourceNote && (
          <div className="qa-field">
            <span className="qa-label">Nguồn</span>
            <p>{meta.sourceNote}</p>
            <span className="tag">{document.source.sourceClass}</span>
          </div>
        )}

        {meta.confidence != null && (
          <div className="qa-field">
            <span className="qa-label">Tin cậy</span>
            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{ width: `${meta.confidence * 100}%` }}
              />
            </div>
            <span>{Math.round(meta.confidence * 100)}%</span>
          </div>
        )}

        {meta.validationSummary && (
          <div className="qa-field">
            <span className="qa-label">Kiểm tra hình học</span>
            <p>{meta.validationSummary}</p>
            {document.validation.valid ? (
              <span className="tag tag-teal">Valid</span>
            ) : (
              <span className="tag tag-clay">Issues found</span>
            )}
          </div>
        )}

        <div className="qa-field">
          <span className="qa-label">Overlay 2D (tường vs phòng)</span>
          <label className="qa-opacity-label">
            Độ mờ phòng: {Math.round(overlayOpacity * 100)}%
            <input
              type="range"
              min={0}
              max={100}
              value={overlayOpacity * 100}
              onChange={(e) => onOverlayOpacityChange(Number(e.target.value) / 100)}
            />
          </label>
          <svg
            viewBox="0 0 400 300"
            className="qa-svg"
            role="img"
            aria-label="Top-down overlay of walls and room polygons"
          >
            <rect x={0} y={0} width={400} height={300} fill="#faf7f2" />
            {document.rooms.map((room) => {
              const points = room.polygon
                .map(([x, z]) => {
                  const [sx, sy] = toSvg(x, z);
                  return `${sx},${sy}`;
                })
                .join(" ");
              return (
                <polygon
                  key={room.id}
                  points={points}
                  fill="#2a9d94"
                  fillOpacity={overlayOpacity}
                  stroke="#1a6b65"
                  strokeWidth={1}
                />
              );
            })}
            {document.walls.map((wall) => {
              const [x1, y1] = toSvg(wall.start[0], wall.start[1]);
              const [x2, y2] = toSvg(wall.end[0], wall.end[1]);
              return (
                <line
                  key={wall.id}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#2c2825"
                  strokeWidth={wall.thicknessM * 8}
                  strokeLinecap="square"
                />
              );
            })}
          </svg>
          <p className="qa-legend">
            <span className="legend-wall">■ Tường</span>
            <span className="legend-room">■ Phòng (mờ)</span>
          </p>
        </div>
      </div>
    </aside>
  );
}
