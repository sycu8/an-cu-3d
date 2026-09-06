import { Link } from "react-router";
import { BRAND, TAGLINE } from "@ancu/shared";
import { ProjectCard } from "../components/ProjectCard";
import { PageSkeleton } from "../components/PageSkeleton";
import { useProjectSummaries } from "../hooks/useProjects";
import { HERO_IMAGE } from "../lib/projectVisuals";
import "./HomePage.css";

export default function HomePage() {
  const state = useProjectSummaries();

  if (state.status === "loading") return <PageSkeleton />;
  if (state.status === "error" && !state.data?.length) {
    return (
      <div className="container page-header">
        <h1>Không tải được dự án</h1>
        <p role="alert">{state.error}</p>
      </div>
    );
  }

  const projects = (state.data ?? []).slice(0, 6);

  return (
    <div className="home">
      <section className="hero" aria-label={BRAND}>
        <div
          className="hero-media"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
          role="img"
          aria-label="Không gian nhà mẫu hiện đại"
        />
        <div className="hero-veil" aria-hidden="true" />
        <div className="container hero-inner">
          <p className="hero-brand">{BRAND}</p>
          <h1 className="hero-title">{TAGLINE}</h1>
          <p className="hero-desc">
            Mặt bằng, không gian 3D và bản đồ kết nối — hiểu căn nhà trước khi gọi là nhà.
          </p>
          <div className="hero-actions">
            <Link to="/projects" className="btn btn-primary btn-lg">
              Khám phá dự án
            </Link>
          </div>
        </div>
      </section>

      <section className="container home-featured">
        <header className="section-head">
          <h2>Dự án nổi bật</h2>
          <p className="section-desc">Không gian thật — dữ liệu minh bạch.</p>
        </header>
        <div className="grid-projects">
          {projects.map((p, i) => (
            <div
              key={p.id}
              className="home-card-enter"
              style={{ animationDelay: `${Math.min(i, 5) * 70}ms` }}
            >
              <ProjectCard project={p} />
            </div>
          ))}
        </div>
        <div className="home-more">
          <Link to="/projects" className="btn btn-secondary">
            Tất cả dự án
          </Link>
        </div>
      </section>
    </div>
  );
}
