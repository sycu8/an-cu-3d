import { Link } from "react-router";
import type { ProjectSummary } from "../types";
import "./ProjectCard.css";

interface ProjectCardProps {
  project: ProjectSummary;
}

function isPending(value: string) {
  return value === "Data pending verification";
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="card project-card">
      <div className="project-card-visual" aria-hidden="true">
        <div className="project-card-placeholder">
          <span>{project.district ?? project.city}</span>
        </div>
      </div>
      <div className="card-body">
        <div className="project-card-meta">
          <span className="tag tag-teal">{project.developerName}</span>
          {project.district && <span className="tag">{project.district}</span>}
        </div>
        <h2>
          <Link to={`/projects/${project.slug}`}>{project.name}</Link>
        </h2>
        {project.tagline && <p className="project-tagline">{project.tagline}</p>}
        <dl className="project-facts">
          <div>
            <dt>Giá</dt>
            <dd className={isPending(project.priceRange) ? "pending-data" : ""}>
              {project.priceRange}
            </dd>
          </div>
          <div>
            <dt>Bàn giao</dt>
            <dd className={isPending(project.handover) ? "pending-data" : ""}>
              {project.handover}
            </dd>
          </div>
        </dl>
        <div className="project-card-actions">
          <Link to={`/projects/${project.slug}`} className="btn btn-primary">
            Khám phá
          </Link>
          <Link to={`/projects/${project.slug}/3d`} className="btn btn-ghost">
            3D
          </Link>
        </div>
        {project.provenance && (
          <p className="provenance">{project.provenance}</p>
        )}
      </div>
    </article>
  );
}
