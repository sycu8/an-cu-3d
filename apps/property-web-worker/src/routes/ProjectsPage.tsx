import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { ProjectCard } from "../components/ProjectCard";
import { ProjectSearchPanel } from "../components/ProjectSearchPanel";
import { PageSkeleton } from "../components/PageSkeleton";
import { useProjectSummaries } from "../hooks/useProjects";
import {
  filterProjects,
  listDistrictOptions,
  parseProjectFilters,
  projectFiltersToSearchParams,
} from "../lib/projectFilters";
import "./ProjectsPage.css";

export default function ProjectsPage() {
  const state = useProjectSummaries();
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => parseProjectFilters(searchParams), [searchParams]);

  const projects = state.status === "loading" ? [] : (state.data ?? []);
  const districts = useMemo(() => listDistrictOptions(projects), [projects]);
  const filtered = useMemo(() => filterProjects(projects, filters), [projects, filters]);

  if (state.status === "loading") return <PageSkeleton />;
  if (state.status === "error" && !state.data?.length) {
    return (
      <div className="container page-header">
        <h1>Dự án</h1>
        <p role="alert">{state.error}</p>
      </div>
    );
  }

  return (
    <div className="container projects-page">
      <header className="page-header projects-header">
        <h1>Dự án</h1>
        <p>
          Lọc theo khu vực, ngân sách và số phòng ngủ — chỉ hiện dữ liệu đã có nguồn.
          Giá chưa xác minh không tham gia lọc giá.
        </p>
      </header>

      <ProjectSearchPanel
        key={searchParams.toString()}
        initial={filters}
        districts={districts}
        mode="local"
        resultCount={filtered.length}
        onApply={(next) => {
          setSearchParams(projectFiltersToSearchParams(next), { replace: true });
        }}
      />

      {filters.amenity && (
        <p className="projects-amenity-hint">
          Đang ưu tiên tiện ích &ldquo;{filters.amenity}&rdquo; —{" "}
          <Link to={`/map?categories=${encodeURIComponent(filters.amenity)}`}>
            mở bản đồ tiện ích
          </Link>
          .
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="projects-empty">
          Không có dự án khớp tiêu chí. Thử nới khoảng giá hoặc bỏ lọc phòng ngủ.
        </p>
      ) : (
        <div className="grid-projects">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
