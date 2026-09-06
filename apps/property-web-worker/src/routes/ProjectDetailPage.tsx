import { Link, useParams } from "react-router";
import { filterProjectMedia } from "@ancu/shared";
import { AMENITY_CATEGORIES } from "../types/amenity";
import { MediaGallery } from "../components/MediaGallery";
import { PageSkeleton } from "../components/PageSkeleton";
import { useProject } from "../hooks/useProjects";
import "./ProjectDetailPage.css";

function isPending(value: string) {
  return value === "Chờ xác minh";
}

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const state = useProject(slug);

  if (state.status === "loading") return <PageSkeleton />;

  if (state.status === "error" || !state.data) {
    return (
      <div className="container page-header">
        <h1>Không tìm thấy dự án</h1>
        <p role="alert">{state.status === "error" ? state.error : "Missing project"}</p>
        <Link to="/projects">← Quay lại danh sách</Link>
      </div>
    );
  }

  const project = state.data;
  const perspectives = filterProjectMedia(project.media, "perspective");
  const floorplan2d = filterProjectMedia(project.media, "floorplan_2d");

  return (
    <div className="container">
      <header className="page-header">
        <div className="project-detail-meta">
          <span className="tag tag-teal">{project.developerName}</span>
          {project.district && <span className="tag">{project.district}</span>}
          {project.confidence != null && (
            <span className="tag tag-clay">Tin cậy: {Math.round(project.confidence * 100)}%</span>
          )}
          {state.source && <span className="tag">src:{state.source}</span>}
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
              {project.address ?? "Chờ xác minh"}
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
        <Link to={`/projects/${project.slug}/showroom?view=3d`} className="btn btn-primary">
          Xem 3D
        </Link>
        <Link to={`/projects/${project.slug}/showroom?view=auto`} className="btn btn-secondary">
          Tự phối cảnh
        </Link>
        <Link to={`/projects/${project.slug}/showroom?view=2d`} className="btn btn-secondary">
          Mặt bằng 2D
        </Link>
        <Link to={`/projects/${project.slug}/showroom?view=perspective`} className="btn btn-ghost">
          Phối cảnh
        </Link>
        <Link to={`/projects/${project.slug}/apartments`} className="btn btn-ghost">
          Căn hộ
        </Link>
        <Link to={`/map?project=${project.slug}`} className="btn btn-ghost">
          Bản đồ
        </Link>
      </section>

      {(perspectives.length > 0 || floorplan2d.length > 0) && (
        <section className="project-gallery-section" aria-label="Hình 2D và phối cảnh">
          <div className="project-gallery-head">
            <div>
              <h2>Phối cảnh & mặt bằng 2D</h2>
              <p>
                Hình minh họa — chờ bản chính thức. Mở showroom để xem 3D hoặc tự phối ánh sáng.
              </p>
            </div>
            <Link to={`/projects/${project.slug}/showroom`} className="btn btn-ghost">
              Mở showroom
            </Link>
          </div>
          {perspectives.length > 0 ? (
            <MediaGallery
              items={perspectives.slice(0, 6)}
              emptyLabel="Chưa có phối cảnh"
              variant="card"
            />
          ) : (
            <MediaGallery
              items={floorplan2d.slice(0, 4)}
              emptyLabel="Chưa có mặt bằng 2D"
              variant="card"
            />
          )}
        </section>
      )}

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
              {apt.confidence != null && (
                <p className="apt-confidence">Tin cậy: {Math.round(apt.confidence * 100)}%</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      {project.nearbyPlaces.length > 0 && (
        <section className="nearby-section">
          <h2>Điểm tiện ích gần dự án</h2>
          <ul className="nearby-list">
            {project.nearbyPlaces.map((place) => {
              const categoryLabel =
                AMENITY_CATEGORIES.find((c) => c.id === place.category)?.label ?? place.category;
              return (
                <li key={place.id} className="nearby-item card card-body">
                  <div className="nearby-item-header">
                    <strong>{place.name}</strong>
                    <span className="tag tag-teal">{categoryLabel}</span>
                  </div>
                  <dl className="nearby-details">
                    <dt>Khoảng cách</dt>
                    <dd className={isPending(place.distanceKm) ? "pending-data" : ""}>
                      {place.distanceKm}
                    </dd>
                    <dt>Thời gian di chuyển</dt>
                    <dd className={isPending(place.travelTime) ? "pending-data" : ""}>
                      {place.travelTime}
                    </dd>
                  </dl>
                  <span className="tag">{place.sourceClass}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
