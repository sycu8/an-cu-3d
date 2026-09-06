import { Link } from "react-router";
import { BRAND, TAGLINE } from "@ancu/shared";
import { ProjectCard } from "../components/ProjectCard";
import { PageSkeleton } from "../components/PageSkeleton";
import { useProjectSummaries } from "../hooks/useProjects";
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

  const projects = ("data" in state && state.data ? state.data : []).slice(0, 6);

  return (
    <div className="home">
      <section className="hero">
        <div className="container hero-inner">
          <h1 className="hero-title">{BRAND}</h1>
          <p className="hero-tagline">{TAGLINE}</p>
          <p className="hero-desc">
            Khám phá dự án bất động sản theo cách kiến trúc — mặt bằng, không gian 3D,
            và bản đồ kết nối — với nguồn dữ liệu minh bạch.
          </p>
          <div className="hero-actions">
            <Link to="/projects" className="btn btn-primary btn-lg">
              Xem dự án
            </Link>
            <Link to="/map" className="btn btn-secondary btn-lg">
              Bản đồ khu vực
            </Link>
          </div>
        </div>
      </section>

      <section className="container home-featured">
        <h2>Dự án nổi bật</h2>
        <p className="section-desc">
          Gamuda Land &amp; dữ liệu demo QA — nguồn: {state.status === "ready" ? state.source : "…"}
        </p>
        <div className="grid-projects">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
        <div className="home-more">
          <Link to="/projects" className="btn btn-secondary">
            Tất cả dự án →
          </Link>
        </div>
      </section>
    </div>
  );
}
