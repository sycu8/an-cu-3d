import { Link, useParams } from "react-router";
import { getProjectBySlug } from "../data/gamuda-projects";

export default function ApartmentsPage() {
  const { slug } = useParams<{ slug: string }>();
  const project = slug ? getProjectBySlug(slug) : undefined;

  if (!project) {
    return (
      <div className="container page-header">
        <h1>Không tìm thấy dự án</h1>
        <Link to="/projects">← Quay lại</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="page-header">
        <p>
          <Link to={`/projects/${project.slug}`}>← {project.name}</Link>
        </p>
        <h1>Căn hộ & mặt bằng</h1>
        <p>Chọn loại căn để xem mặt bằng 3D và bảng QA.</p>
      </header>
      <div className="apartment-type-grid">
        {project.apartmentTypes.map((apt) => (
          <Link
            key={apt.id}
            to={`/projects/${project.slug}/apartments/${apt.slug}`}
            className="card card-body apartment-type-card"
          >
            <h3>{apt.name}</h3>
            <p>
              {apt.bedrooms != null ? `${apt.bedrooms} phòng ngủ` : "—"}
              {apt.bathrooms != null ? ` · ${apt.bathrooms} phòng tắm` : ""}
            </p>
            <p className={apt.areaSqm === "Data pending verification" ? "pending-data" : ""}>
              {apt.areaSqm} m²
            </p>
            {apt.confidence != null && (
              <span className="tag tag-clay">Tin cậy: {Math.round(apt.confidence * 100)}%</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
