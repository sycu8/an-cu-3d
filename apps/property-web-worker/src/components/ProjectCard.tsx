import { Link } from "react-router";
import type { ProjectSummary } from "../types";
import { projectCoverUrl } from "../lib/projectVisuals";
import "./ProjectCard.css";

interface ProjectCardProps {
  project: ProjectSummary;
}

function isPending(value: string) {
  return value === "Chờ xác minh";
}

export function ProjectCard({ project }: ProjectCardProps) {
  const cover = projectCoverUrl(project.slug);

  return (
    <article className="project-card">
      <Link to={`/projects/${project.slug}`} className="project-card-media">
        <img src={cover} alt="" loading="lazy" />
        <span className="project-card-place">
          {project.district ?? project.city}
        </span>
      </Link>
      <div className="project-card-body">
        <p className="project-card-developer">{project.developerName}</p>
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
          <Link to={`/projects/${project.slug}/showroom`} className="btn btn-ghost">
            Showroom
          </Link>
        </div>
      </div>
    </article>
  );
}
