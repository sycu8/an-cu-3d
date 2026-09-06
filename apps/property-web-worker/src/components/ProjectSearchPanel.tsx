import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
  AMENITY_QUICK_OPTIONS,
  BEDROOM_OPTIONS,
  PRICE_BAND_OPTIONS,
  emptyProjectFilters,
  hasActiveProjectFilters,
  searchDestination,
  type ProjectFilters,
} from "../lib/projectFilters";
import "./ProjectSearchPanel.css";

type ProjectSearchPanelProps = {
  initial?: ProjectFilters;
  districts?: string[];
  /** When true, apply filters via onSubmit instead of navigating. */
  mode?: "navigate" | "local";
  onApply?: (filters: ProjectFilters) => void;
  variant?: "hero" | "page";
  resultCount?: number;
};

export function ProjectSearchPanel({
  initial,
  districts = [],
  mode = "navigate",
  onApply,
  variant = "page",
  resultCount,
}: ProjectSearchPanelProps) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ProjectFilters>(
    () => initial ?? emptyProjectFilters(),
  );
  const [advancedOpen, setAdvancedOpen] = useState(() =>
    Boolean(
      initial &&
        (initial.priceBand ||
          initial.bedrooms != null ||
          initial.amenity ||
          initial.district),
    ),
  );

  const active = useMemo(() => hasActiveProjectFilters(filters), [filters]);

  function patch(partial: Partial<ProjectFilters>) {
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (mode === "local" && onApply) {
      onApply(filters);
      return;
    }
    navigate(searchDestination(filters));
  }

  function reset() {
    const cleared = emptyProjectFilters();
    setFilters(cleared);
    if (mode === "local" && onApply) onApply(cleared);
  }

  return (
    <form
      className={`project-search project-search--${variant}${advancedOpen ? " is-advanced" : ""}`}
      onSubmit={submit}
      aria-label="Tìm dự án theo tiêu chí"
    >
      <div className="project-search-primary">
        <label className="project-search-field project-search-field--grow">
          <span className="sr-only">Từ khóa</span>
          <input
            type="search"
            name="q"
            placeholder="Tên dự án, chủ đầu tư, khu vực…"
            value={filters.q}
            onChange={(e) => patch({ q: e.target.value })}
            autoComplete="off"
          />
        </label>
        <label className="project-search-field">
          <span className="sr-only">Khu vực</span>
          <select
            name="district"
            value={filters.district}
            onChange={(e) => patch({ district: e.target.value })}
          >
            <option value="">Mọi khu vực</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary project-search-submit">
          Tìm kiếm
        </button>
      </div>

      <div className="project-search-toolbar">
        <button
          type="button"
          className="project-search-advanced-toggle"
          aria-expanded={advancedOpen}
          onClick={() => setAdvancedOpen((v) => !v)}
        >
          Tiêu chí nâng cao
        </button>
        {typeof resultCount === "number" && (
          <p className="project-search-count" aria-live="polite">
            {resultCount} dự án phù hợp
          </p>
        )}
        {active && (
          <button type="button" className="project-search-reset" onClick={reset}>
            Xóa bộ lọc
          </button>
        )}
      </div>

      {advancedOpen && (
        <div className="project-search-advanced" role="group" aria-label="Bộ lọc nâng cao">
          <label className="project-search-field">
            <span>Khoảng giá</span>
            <select
              name="price"
              value={filters.priceBand}
              onChange={(e) =>
                patch({ priceBand: e.target.value as ProjectFilters["priceBand"] })
              }
            >
              {PRICE_BAND_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="project-search-field">
            <span>Phòng ngủ</span>
            <select
              name="bedrooms"
              value={filters.bedrooms ?? ""}
              onChange={(e) =>
                patch({
                  bedrooms: e.target.value ? Number(e.target.value) : null,
                })
              }
            >
              {BEDROOM_OPTIONS.map((o) => (
                <option key={String(o.value)} value={o.value ?? ""}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="project-search-field">
            <span>Tiện ích xung quanh</span>
            <select
              name="amenity"
              value={filters.amenity}
              onChange={(e) => patch({ amenity: e.target.value })}
            >
              {AMENITY_QUICK_OPTIONS.map((o) => (
                <option key={o.value || "none"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </form>
  );
}
