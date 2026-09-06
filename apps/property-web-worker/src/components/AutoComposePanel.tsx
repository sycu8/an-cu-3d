import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_MATERIAL_PALETTES,
  LIGHTING_PRESETS,
  type LightingPreset,
  type MaterialPalette,
} from "@ancu/shared";
import "./AutoComposePanel.css";

type AutoComposePanelProps = {
  lighting: LightingPreset;
  palette: MaterialPalette;
  onLightingChange: (preset: LightingPreset) => void;
  onPaletteChange: (paletteLabel: string) => void;
  onOpen3d: () => void;
  cycling?: boolean;
  onCyclingChange?: (next: boolean) => void;
};

const PRESET_ORDER = Object.keys(LIGHTING_PRESETS) as LightingPreset[];

export function AutoComposePanel({
  lighting,
  palette,
  onLightingChange,
  onPaletteChange,
  onOpen3d,
  cycling = true,
  onCyclingChange,
}: AutoComposePanelProps) {
  const [tick, setTick] = useState(0);
  const preset = LIGHTING_PRESETS[lighting];

  useEffect(() => {
    if (!cycling) return;
    const id = window.setInterval(() => {
      setTick((n) => n + 1);
    }, 4200);
    return () => window.clearInterval(id);
  }, [cycling]);

  useEffect(() => {
    if (!cycling) return;
    const next = PRESET_ORDER[tick % PRESET_ORDER.length]!;
    if (next !== lighting) onLightingChange(next);
    const nextPalette =
      DEFAULT_MATERIAL_PALETTES[tick % DEFAULT_MATERIAL_PALETTES.length]!;
    if (nextPalette.label !== palette.label) onPaletteChange(nextPalette.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drive from tick only
  }, [tick, cycling]);

  const swatches = useMemo(
    () => [
      { label: "Sàn", color: palette.floor },
      { label: "Tường", color: palette.wall },
      { label: "Tủ", color: palette.cabinet },
      { label: "Accent", color: palette.accent },
    ],
    [palette],
  );

  return (
    <aside className="auto-compose-panel">
      <header>
        <p className="auto-compose-eyebrow">Tự phối cảnh</p>
        <h2>Ghép ánh sáng + vật liệu</h2>
        <p>
          Xoay preset ánh sáng và bảng màu để dựng góc nhìn 3D — không bịa số liệu
          diện tích / giá.
        </p>
      </header>

      <div
        className="auto-compose-stage"
        style={{
          background: `linear-gradient(160deg, ${preset.skyColor}, ${preset.groundColor})`,
        }}
      >
        <div className="auto-compose-room" style={{ background: palette.wall }}>
          <div className="auto-compose-floor" style={{ background: palette.floor }} />
          <div className="auto-compose-cabinet" style={{ background: palette.cabinet }} />
          <div className="auto-compose-accent" style={{ background: palette.accent }} />
        </div>
        <p className="auto-compose-caption">
          {preset.label} · {palette.label}
        </p>
      </div>

      <div className="auto-compose-swatches">
        {swatches.map((s) => (
          <div key={s.label}>
            <span style={{ background: s.color }} />
            <em>{s.label}</em>
          </div>
        ))}
      </div>

      <label className="auto-compose-toggle">
        <input
          type="checkbox"
          checked={cycling}
          onChange={(e) => onCyclingChange?.(e.target.checked)}
        />
        Tự xoay ánh sáng
      </label>

      <label>
        Bảng màu
        <select
          value={palette.label}
          onChange={(e) => onPaletteChange(e.target.value)}
        >
          {DEFAULT_MATERIAL_PALETTES.map((p) => (
            <option key={p.label} value={p.label}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <div className="auto-compose-actions">
        <button type="button" className="btn btn-primary" onClick={onOpen3d}>
          Xem 3D với phối cảnh này
        </button>
      </div>
    </aside>
  );
}
