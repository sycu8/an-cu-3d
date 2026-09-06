import { Link } from "react-router";
import type { ProjectSummary } from "../types";
import { projectCoverUrl } from "../lib/projectVisuals";
import "./ProjectCard.css";

type ProjectCardProps = {
  project: ProjectSummary;
};

function displayFact(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const cover = projectCoverUrl(project.slug, project);
  const place = project.district ?? project.city;
  const price = displayFact(project.priceRange);
  const handover = displayFact(project.handover);

  return (
    <article className="project-card">
      <Link to={`/projects/${project.slug}`} className="project-card-media">
        <img src={cover} alt="" loading="lazy" decoding="async" />
        {place && <span className="project-card-place">{place}</span>}
      </Link>
      <div className="project-card-body">
        <p className="project-card-developer">{project.developerName}</p>
        <h2>
          <Link to={`/projects/${project.slug}`}>{project.name}</Link>
        </h2>
        {project.tagline && <p className="project-tagline">{project.tagline}</p>}
        {(price || handover) && (
          <dl className="project-facts">
            {price && (
              <div>
                <dt>Giá</dt>
                <dd>{price}</dd>
              </div>
            )}
            {handover && (
              <div>
                <dt>Bàn giao</dt>
                <dd>{handover}</dd>
              </div>
            )}
          </dl>
        )}
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
