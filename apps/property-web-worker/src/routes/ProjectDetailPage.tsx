import { Link, useParams } from "react-router";
import { getProjectBySlug } from "../data/gamuda-projects";
import "./ProjectDetailPage.css";

function isPending(value: string) {
  return value === "Data pending verification";
}

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const project = slug ? getProjectBySlug(slug) : undefined;

  if (!project) {
    return (
      <div className="container page-header">
        <h1>Không tìm thấy dự án</h1>
        <Link to="/projects">← Quay lại danh sách</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="page-header">
        <div className="project-detail-meta">
          <span className="tag tag-teal">{project.developerName}</span>
          {project.district && <span className="tag">{project.district}</span>}
          {project.confidence != null && (
            <span className="tag tag-clay">Tin cậy: {Math.round(project.confidence * 100)}%</span>
          )}
        </div>
        <h1>{project.name}</h1>
        {project.tagline && <p>{project.tagline}</p>}
        {project.description && <p className="project-description">{project.description}</p>}
        {project.provenance && <p className="provenance">Nguồn: {project.provenance}</p>}
      </header>

      <section className="project-facts-grid">
        <div className="card card-body">
          <h3>Thông tin</h3>
          <dl>
            <dt>Địa chỉ</dt>
            <dd className={isPending(project.address ?? "") ? "pending-data" : ""}>
              {project.address ?? "Data pending verification"}
            </dd>
            <dt>Giá</dt>
            <dd className={isPending(project.priceRange) ? "pending-data" : ""}>{project.priceRange}</dd>
            <dt>Bàn giao</dt>
            <dd className={isPending(project.handover) ? "pending-data" : ""}>{project.handover}</dd>
            <dt>Quy mô</dt>
            <dd className={isPending(project.totalUnits) ? "pending-data" : ""}>{project.totalUnits}</dd>
          </dl>
        </div>
        <div className="card card-body">
          <h3>Tiện ích</h3>
          <ul className="amenity-list">
            {project.amenities.map((a) => (
              <li key={`${a.category}-${a.name}`}>
                <span className="tag">{a.category}</span> {a.name}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="project-actions-bar">
        <Link to={`/projects/${project.slug}/3d`} className="btn btn-primary">
          Xem 3D dự án
        </Link>
        <Link to={`/projects/${project.slug}/apartments`} className="btn btn-secondary">
          Căn hộ & mặt bằng
        </Link>
        <Link to={`/map?project=${project.slug}`} className="btn btn-ghost">
          Vị trí trên bản đồ
        </Link>
        <Link to={`/compare?a=${project.slug}`} className="btn btn-ghost">
          So sánh
        </Link>
      </section>

      <section>
        <h2>Loại căn hộ</h2>
        <div className="apartment-type-grid">
          {project.apartmentTypes.map((apt) => (
            <Link
              key={apt.id}
              to={`/projects/${project.slug}/apartments/${apt.slug}`}
              className="card card-body apartment-type-card"
            >
              <h3>{apt.name}</h3>
              <p>
                {apt.bedrooms != null ? `${apt.bedrooms} PN` : "—"} ·{" "}
                <span className={isPending(apt.areaSqm) ? "pending-data" : ""}>{apt.areaSqm}</span>
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
