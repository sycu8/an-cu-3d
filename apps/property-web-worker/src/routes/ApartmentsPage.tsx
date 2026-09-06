import { Link, useParams } from "react-router";
import { floorplanVerificationLabel } from "@ancu/shared";
import { DataTrustBadge } from "../components/DataTrustBadge";
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
        <h1>Chọn căn phù hợp</h1>
        <p>Mỗi loại căn hiển thị trạng thái xác minh mặt bằng trước khi mở 2D/3D.</p>
      </header>
      <div className="apartment-type-grid">
        {project.apartmentTypes.map((apt) => {
          const verification = apt.floorplanVerification ?? "unknown";
          const canExplore = verification !== "unknown";
          return (
            <Link
              key={apt.id}
              to={
                canExplore
                  ? `/projects/${project.slug}/apartments/${apt.slug}`
                  : `/projects/${project.slug}?unit=${apt.slug}`
              }
              className="card card-body apartment-type-card"
            >
              <h3>{apt.name}</h3>
              <p>
                {apt.bedrooms != null ? `${apt.bedrooms} phòng ngủ` : "—"}
                {apt.bathrooms != null ? ` · ${apt.bathrooms} phòng tắm` : ""}
              </p>
              {apt.areaSqm?.trim() && <p>{apt.areaSqm}</p>}
              {apt.price?.trim() && <p>Giá: {apt.price}</p>}
              <DataTrustBadge
                compact
                sourceClass={apt.sourceClass}
                floorplanVerification={verification}
              />
              <p className="apt-confidence">{floorplanVerificationLabel(verification)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
