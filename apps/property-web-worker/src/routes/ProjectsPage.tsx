import { ProjectCard } from "../components/ProjectCard";
import { PageSkeleton } from "../components/PageSkeleton";
import { useProjectSummaries } from "../hooks/useProjects";
import "./ProjectsPage.css";

export default function ProjectsPage() {
  const state = useProjectSummaries();

  if (state.status === "loading") return <PageSkeleton />;
  if (state.status === "error" && !state.data?.length) {
    return (
      <div className="container page-header">
        <h1>Dự án</h1>
        <p role="alert">{state.error}</p>
      </div>
    );
  }

  const projects = state.data ?? [];

  return (
    <div className="container projects-page">
      <header className="page-header projects-header">
        <h1>Dự án</h1>
        <p>
          Danh sách dự án với nguồn và mức tin cậy rõ ràng. Thông tin chưa xác minh
          hiển thị &ldquo;Chờ xác minh&rdquo;.
        </p>
      </header>
      {projects.length === 0 ? (
        <p className="projects-empty">Chưa có dự án nào.</p>
      ) : (
        <div className="grid-projects">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
