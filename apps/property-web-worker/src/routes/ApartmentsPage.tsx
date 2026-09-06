import { Link, useParams } from "react-router";
import { PageSkeleton } from "../components/PageSkeleton";
import { useProject } from "../hooks/useProjects";

export default function ApartmentsPage() {
  const { slug } = useParams<{ slug: string }>();
  const state = useProject(slug);

  if (state.status === "loading") return <PageSkeleton />;

  if (state.status === "error" || !state.data) {
    return (
      <div className="container page-header">
        <h1>Không tìm thấy dự án</h1>
        <p role="alert">{state.status === "error" ? state.error : "Missing project"}</p>
        <Link to="/projects">← Quay lại</Link>
      </div>
    );
  }

  const project = state.data;

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
            {apt.areaSqm?.trim() && <p>{apt.areaSqm}</p>}
            {apt.price?.trim() && <p>Giá: {apt.price}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
