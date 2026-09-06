import { getProjectSummaries } from "../data/gamuda-projects";
import { ProjectCard } from "../components/ProjectCard";

export default function ProjectsPage() {
  const projects = getProjectSummaries();

  return (
    <div className="container">
      <header className="page-header">
        <h1>Dự án</h1>
        <p>
          Danh sách dự án với nguồn dữ liệu và mức tin cậy được ghi rõ.
          Thông tin chưa xác minh hiển thị &ldquo;Data pending verification&rdquo;.
        </p>
      </header>
      <div className="grid-projects">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
}
