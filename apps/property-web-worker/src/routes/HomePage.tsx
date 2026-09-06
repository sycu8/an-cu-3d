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
            Mặt bằng, không gian 3D và bản đồ — hiểu căn nhà trước khi gọi là nhà.
          </p>
          <div className="hero-actions">
            <Link to="/projects" className="btn btn-primary btn-lg">
              Khám phá dự án
            </Link>
            <Link to="/map" className="btn btn-hero-ghost btn-lg">
              Xem bản đồ
            </Link>
          </div>
        </div>
        <a href="#featured" className="hero-scroll" aria-label="Xuống dự án nổi bật">
          <span aria-hidden="true" />
        </a>
      </section>

      <section id="featured" className="container home-featured">
        <header className="section-head">
          <h2>Dự án nổi bật</h2>
          <p className="section-desc">Không gian thật — dữ liệu minh bạch, nguồn rõ ràng.</p>
        </header>
        <div className="home-project-rail" role="list">
          {projects.map((p, i) => (
            <div
              key={p.id}
              role="listitem"
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

      <section className="home-retain container">
        <div className="home-retain-panel">
          <h2>Ở lại với không gian thật</h2>
          <p>
            So sánh dự án, mở showroom 3D, hoặc tự phối ánh sáng — mượt trên điện thoại.
          </p>
          <div className="home-retain-actions">
            <Link to="/compare" className="btn btn-primary">
              So sánh dự án
            </Link>
            <Link to="/blog" className="btn btn-ghost">
              Đọc blog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
