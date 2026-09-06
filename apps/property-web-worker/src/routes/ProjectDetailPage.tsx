import { Link, useParams } from "react-router";
import { filterProjectMedia } from "@ancu/shared";
import { AMENITY_CATEGORIES } from "../types/amenity";
import { MediaGallery } from "../components/MediaGallery";
import { PageSkeleton } from "../components/PageSkeleton";
import { ProjectInfographic } from "../components/ProjectInfographic";
import { useProject } from "../hooks/useProjects";
import { projectCoverUrl } from "../lib/projectVisuals";
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
  const cover = projectCoverUrl(project.slug, project);
  const perspectives = filterProjectMedia(project.media, "perspective");
  const floorplan2d = filterProjectMedia(project.media, "floorplan_2d");
  const atlases = filterProjectMedia(project.media, "atlas").filter((m) =>
    Boolean(m.url?.trim() || m.r2Key?.trim()),
  );

  return (
    <div className="project-detail">
      <section className="project-hero" aria-label={project.name}>
        <div
          className="project-hero-media"
          style={{ backgroundImage: `url(${cover})` }}
          role="img"
          aria-label={`Hình cover ${project.name}`}
        />
        <div className="project-hero-veil" aria-hidden="true" />
        <div className="container project-hero-inner">
          <p className="project-hero-developer">{project.developerName}</p>
          <h1>{project.name}</h1>
          <p className="project-hero-tagline">
            {project.tagline ?? "Khám phá không gian thật trước khi quyết định."}
          </p>
          <div className="project-hero-actions">
            <Link to={`/projects/${project.slug}/showroom?view=3d`} className="btn btn-primary btn-lg">
              Xem showroom 3D
            </Link>
            <Link to={`/projects/${project.slug}/apartments`} className="btn btn-hero-ghost btn-lg">
              Loại căn
            </Link>
          </div>
        </div>
      </section>

      <div className="container project-detail-body">
      <div className="project-detail-meta">
        {project.district && <span className="tag">{project.district}</span>}
        {project.confidence != null && (
          <span className="tag tag-clay">Tin cậy: {Math.round(project.confidence * 100)}%</span>
        )}
        {state.source && <span className="tag">src:{state.source}</span>}
      </div>
      {project.description && <p className="project-description">{project.description}</p>}
      {project.provenance && <p className="provenance">Nguồn: {project.provenance}</p>}

      <ProjectInfographic project={project} />

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
            {project.priceProvenance && (
              <>
                <dt>Nguồn giá</dt>
                <dd className="provenance">{project.priceProvenance}</dd>
              </>
            )}
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

      <section className="project-actions-bar" aria-label="Lối tắt dự án">
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

      <div className="project-mobile-cta" aria-label="Thao tác nhanh">
        <Link to={`/projects/${project.slug}/showroom?view=3d`} className="btn btn-primary">
          Showroom 3D
        </Link>
        <Link to={`/compare?a=${project.slug}`} className="btn btn-secondary">
          So sánh
        </Link>
      </div>

      {(perspectives.length > 0 || floorplan2d.length > 0 || atlases.length > 0) && (
        <section className="project-gallery-section" aria-label="Hình 2D, phối cảnh và atlas">
          <div className="project-gallery-head">
            <div>
              <h2>Phối cảnh, mặt bằng & atlas</h2>
              <p>
                Hình minh họa / atlas quy hoạch — chờ bản chính thức từ CĐT. Mở showroom để xem 3D.
              </p>
            </div>
            <Link to={`/projects/${project.slug}/showroom`} className="btn btn-ghost">
              Mở showroom
            </Link>
          </div>
          {atlases.length > 0 && (
            <MediaGallery
              items={atlases.slice(0, 4)}
              emptyLabel="Chưa có atlas"
              variant="card"
            />
          )}
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
              <p className={isPending(apt.price) ? "pending-data" : ""}>Giá: {apt.price}</p>
              {apt.confidence != null && (
                <p className="apt-confidence">Tin cậy: {Math.round(apt.confidence * 100)}%</p>
              )}
            </Link>
          ))}
        </div>
      </section>

      {(project.documents?.length ?? 0) > 0 && (
        <section className="project-docs-section">
          <h2>Tài liệu & pháp lý</h2>
          <ul className="project-docs-list">
            {project.documents!.map((doc) => (
              <li key={doc.id} className="card card-body">
                <div className="project-docs-head">
                  <strong>{doc.title}</strong>
                  <span className={`tag ${doc.status === "verified" ? "tag-teal" : "tag-clay"}`}>
                    {doc.status === "verified"
                      ? "Đã xác minh"
                      : doc.status === "unavailable"
                        ? "Không có"
                        : "Chờ xác minh"}
                  </span>
                </div>
                {doc.note && <p>{doc.note}</p>}
                {doc.issuedAt && <p className="provenance">Thời điểm: {doc.issuedAt}</p>}
                {doc.provenance && <p className="provenance">Nguồn: {doc.provenance}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(project.handoverUnits?.length ?? 0) > 0 && (
        <section className="project-handover-section">
          <h2>Căn hộ / phân khu bàn giao</h2>
          <ul className="project-handover-list">
            {project.handoverUnits!.map((unit) => (
              <li key={unit.id} className="card card-body">
                <div className="project-docs-head">
                  <strong>{unit.label}</strong>
                  <span className="tag tag-teal">
                    {unit.status === "handed_over"
                      ? "Đã bàn giao"
                      : unit.status === "construction"
                        ? "Đang xây"
                        : unit.status === "selling"
                          ? "Đang bán"
                          : "Sắp tới"}
                  </span>
                </div>
                {unit.tower && <p>Tháp / phân khu: {unit.tower}</p>}
                {unit.handedOverAt && <p>Mốc: {unit.handedOverAt}</p>}
                {unit.note && <p>{unit.note}</p>}
                {unit.provenance && <p className="provenance">Nguồn: {unit.provenance}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

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
    </div>
  );
}
