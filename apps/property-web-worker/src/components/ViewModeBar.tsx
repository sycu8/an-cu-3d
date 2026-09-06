import { UNIT_VIEW_MODE_LABELS, type UnitViewMode } from "@ancu/shared";
import "./ViewModeBar.css";

const MODES: UnitViewMode[] = ["2d", "perspective", "3d", "auto"];

type ViewModeBarProps = {
  value: UnitViewMode;
  onChange: (mode: UnitViewMode) => void;
  counts?: Partial<Record<"2d" | "perspective", number>>;
};

export function ViewModeBar({ value, onChange, counts }: ViewModeBarProps) {
  return (
    <div className="view-mode-bar" role="tablist" aria-label="Chế độ xem nhà mẫu">
      {MODES.map((mode) => {
        const count =
          mode === "2d" || mode === "perspective" ? counts?.[mode] : undefined;
        return (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={value === mode}
            className={value === mode ? "active" : undefined}
            onClick={() => onChange(mode)}
          >
            {UNIT_VIEW_MODE_LABELS[mode]}
            {typeof count === "number" && count > 0 ? (
              <span className="view-mode-count">{count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
