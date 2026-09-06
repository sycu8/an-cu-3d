import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  filterProjectMedia,
  floorplanVerificationLabel,
  type FloorplanVerificationStatusType,
  type LifestylePreferences,
} from "@ancu/shared";
import { DataTrustBadge } from "../components/DataTrustBadge";
import { FitAssessmentPanel } from "../components/FitAssessmentPanel";
import { LifestylePreferencesForm } from "../components/LifestylePreferencesForm";
import { MediaGallery } from "../components/MediaGallery";
import { PageSkeleton } from "../components/PageSkeleton";
import { resolveFloorPlanForUnit } from "../data/sample-floorplans";
import { useProject } from "../hooks/useProjects";
import { loadLifestylePreferences } from "../lib/lifestylePreferences";
import { projectCoverUrl } from "../lib/projectVisuals";
import { AMENITY_CATEGORIES } from "../types/amenity";
import "./ProjectDetailPage.css";

function displayFact(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^chờ xác minh/i.test(trimmed)) return null;
  return trimmed;
}

function bedroomLabel(bedrooms: number | undefined): string {
  if (bedrooms == null) return "Loại căn";
  if (bedrooms === 0) return "Studio";
  return `${bedrooms} PN`;
}

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [params, setParams] = useSearchParams();
  const state = useProject(slug);
  const [prefs, setPrefs] = useState<LifestylePreferences>(() =>
    loadLifestylePreferences(),
  );

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

  const address = displayFact(project.address);
  const priceRange = displayFact(project.priceRange);
  const handover = displayFact(project.handover);
  const totalUnits = displayFact(project.totalUnits);
  const majorAmenity = project.amenities[0]?.name ?? null;

  const selectedUnit = params.get("unit");
  const selectedApt =
    project.apartmentTypes.find((a) => a.slug === selectedUnit) ??
    project.apartmentTypes[0] ??
    null;

  function selectUnit(unitSlug: string) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("unit", unitSlug);
      return next;
    }, { replace: true });
  }

  const precincts = (project.handoverUnits ?? []).map((u) => ({
    id: u.id,
    label: u.tower ?? u.label,
    status: u.status,
    note: u.note,
  }));

  const quickFacts = [
    address ? { label: "Vị trí", value: address } : null,
    project.district || project.city
      ? {
          label: "Khu vực",
          value: [project.district, project.city].filter(Boolean).join(", "),
        }
      : null,
    project.apartmentTypes.length
      ? {
          label: "Loại căn",
          value: project.apartmentTypes
            .map((a) => bedroomLabel(a.bedrooms))
            .filter((v, i, arr) => arr.indexOf(v) === i)
            .join(" · "),
        }
      : null,
    handover ? { label: "Bàn giao", value: handover } : null,
    totalUnits ? { label: "Quy mô", value: totalUnits } : null,
    majorAmenity ? { label: "Tiện ích nổi bật", value: majorAmenity } : null,
    priceRange ? { label: "Giá (đã xác minh)", value: priceRange } : null,
  ].filter((f): f is { label: string; value: string } => Boolean(f));

  const exploreHref = selectedApt
    ? `/projects/${project.slug}/apartments/${selectedApt.slug}`
    : `/projects/${project.slug}/apartments`;
  const compareHref = selectedApt
    ? `/compare?a=${project.slug}&unit=${selectedApt.slug}`
    : `/compare?a=${project.slug}`;

  return (
    <div className="project-detail">
      {/* HERO */}
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
            {project.tagline ?? "Hiểu căn nhà trước khi gọi là nhà."}
          </p>
          <div className="project-hero-actions">
            <Link to={exploreHref} className="btn btn-primary btn-lg">
              Khám phá căn hộ
            </Link>
            <Link to={`/projects/${project.slug}/3d`} className="btn btn-hero-ghost btn-lg">
              Khám phá toàn khu
            </Link>
          </div>
          <div className="project-hero-trust">
            <DataTrustBadge
              sourceClass={project.sourceClass}
              provenance={project.provenance}
              verifiedAt={project.updatedAt}
            />
          </div>
        </div>
      </section>

      <div className="container project-detail-body">
        {/* QUICK FACTS */}
        {quickFacts.length > 0 && (
          <section className="project-quick-facts" aria-label="Thông tin nhanh">
            <ul className="project-quick-facts-list">
              {quickFacts.slice(0, 6).map((fact) => (
                <li key={fact.label}>
                  <span className="project-quick-facts-label">{fact.label}</span>
                  <strong>{fact.value}</strong>
                </li>
              ))}
            </ul>
          </section>
        )}

        {project.description && (
          <p className="project-description">{project.description}</p>
        )}

        {/* SECTION 01 — Explore project / masterplan fallback */}
        <section className="project-section" id="explore">
          <header className="project-section-head">
            <p className="project-section-kicker">01 · Khám phá dự án</p>
            <h2>Khám phá {project.name}</h2>
            <p>
              Hiểu tổng thể khu đô thị trước khi chọn căn. Bản đồ phân khu dựa trên
              tiến độ bàn giao đã công bố — chưa phải mô hình BIM đầy đủ.
            </p>
          </header>

          {precincts.length > 0 ? (
            <div className="masterplan-explorer" role="list">
              {precincts.map((p) => (
                <article key={p.id} className="masterplan-precinct" role="listitem">
                  <h3>{p.label}</h3>
                  <span className="tag tag-teal">
                    {p.status === "handed_over"
                      ? "Đã bàn giao"
                      : p.status === "construction"
                        ? "Đang xây"
                        : p.status === "selling"
                          ? "Đang bán"
                          : "Sắp tới"}
                  </span>
                  {p.note && <p>{p.note}</p>}
                </article>
              ))}
            </div>
          ) : (
            <p className="project-empty-note">
              Chưa đủ dữ liệu masterplan đã xác minh để hiển thị phân khu.
            </p>
          )}

          {(atlases.length > 0 || perspectives.length > 0) && (
            <div className="project-gallery-section">
              <MediaGallery
                items={(atlases.length ? atlases : perspectives).slice(0, 4)}
                emptyLabel="Chưa có hình tổng thể"
                variant="card"
              />
            </div>
          )}
        </section>

        {/* SECTION 02 — Choose apartment */}
        <section className="project-section" id="apartments">
          <header className="project-section-head">
            <p className="project-section-kicker">02 · Chọn căn phù hợp</p>
            <h2>Bạn đang tìm căn nào?</h2>
            <p>Chọn loại căn để xem trạng thái xác minh mặt bằng trước khi khám phá không gian.</p>
          </header>

          {project.apartmentTypes.length === 0 ? (
            <p className="project-empty-note">Chưa có loại căn được công bố.</p>
          ) : (
            <div className="apartment-type-grid" role="list">
              {project.apartmentTypes.map((apt) => {
                const area = displayFact(apt.areaSqm);
                const price = displayFact(apt.price);
                const verification = (apt.floorplanVerification ??
                  "unknown") as FloorplanVerificationStatusType;
                const selected = selectedApt?.id === apt.id;
                return (
                  <button
                    key={apt.id}
                    type="button"
                    role="listitem"
                    className={`apartment-type-card ${selected ? "is-selected" : ""}`}
                    aria-pressed={selected}
                    onClick={() => selectUnit(apt.slug)}
                  >
                    <h3>{bedroomLabel(apt.bedrooms)}</h3>
                    <p className="apartment-type-name">{apt.name}</p>
                    {area && <p className="apartment-type-meta">Diện tích: {area}</p>}
                    {price && <p className="apartment-type-meta">Giá: {price}</p>}
                    <DataTrustBadge
                      compact
                      sourceClass={apt.sourceClass}
                      floorplanVerification={verification}
                    />
                    <span className="apartment-type-verify">
                      {floorplanVerificationLabel(verification)}
                    </span>
                    <Link
                      to={`/projects/${project.slug}/apartments/${apt.slug}`}
                      className="btn btn-secondary apartment-type-cta"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Khám phá căn
                    </Link>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 03 — Understand space */}
        <section className="project-section" id="space">
          <header className="project-section-head">
            <p className="project-section-kicker">03 · Hiểu không gian</p>
            <h2>Xem 2D, 3D hoặc thử nội thất</h2>
            <p>
              {selectedApt
                ? `Đang chọn: ${selectedApt.name}. Chuyển chế độ xem mà không mất ngữ cảnh căn.`
                : "Chọn một loại căn ở trên để mở không gian."}
            </p>
          </header>

          {selectedApt ? (
            <div className="space-mode-switch" role="group" aria-label="Chế độ xem không gian">
              <Link
                to={`/projects/${project.slug}/apartments/${selectedApt.slug}?view=2d`}
                className="btn btn-secondary"
              >
                Xem 2D
              </Link>
              <Link
                to={`/projects/${project.slug}/showroom?unit=${selectedApt.slug}&view=3d`}
                className="btn btn-primary"
              >
                Xem 3D
              </Link>
              <Link
                to={`/projects/${project.slug}/showroom?unit=${selectedApt.slug}&view=auto`}
                className="btn btn-secondary"
              >
                Thử nội thất
              </Link>
              {(selectedApt.floorplanVerification === "unknown" ||
                selectedApt.floorplanVerification === "illustrative") && (
                <p className="project-empty-note space-mode-note" role="status">
                  {floorplanVerificationLabel(
                    (selectedApt.floorplanVerification ??
                      "unknown") as FloorplanVerificationStatusType,
                  )}
                  . Số đo chính xác sẽ được ẩn hoặc đánh dấu ước lượng.
                </p>
              )}
            </div>
          ) : (
            <p className="project-empty-note">Chọn loại căn để tiếp tục.</p>
          )}

          {floorplan2d.length > 0 && (
            <MediaGallery
              items={floorplan2d.slice(0, 3)}
              emptyLabel="Chưa có mặt bằng 2D"
              variant="card"
            />
          )}
        </section>

        {/* SECTION 04 — Fit preview */}
        <section className="project-section" id="fit">
          <header className="project-section-head">
            <p className="project-section-kicker">04 · Căn này có hợp với bạn?</p>
            <h2>Đánh giá không gian</h2>
            <p>
              Điểm dựa trên hộ gia đình bạn chọn và dữ liệu loại căn — bố trí nội thất
              chỉ khi mặt bằng đã xác minh.
            </p>
          </header>
          {selectedApt ? (
            <div className="project-fit-grid">
              <FitAssessmentPanel
                preferences={prefs}
                bedrooms={selectedApt.bedrooms}
                bathrooms={selectedApt.bathrooms}
                rooms={(() => {
                  const resolved = resolveFloorPlanForUnit({
                    floorplanKey: selectedApt.floorplanKey,
                    unitSlug: selectedApt.slug,
                    bedrooms: selectedApt.bedrooms,
                  });
                  return resolved.document?.rooms.map((r) => ({
                    id: r.id,
                    type: r.type,
                    name: r.name,
                    polygon: r.polygon as [number, number][],
                    areaSqM: r.areaSqM,
                  }));
                })()}
                floorplanVerified={
                  selectedApt.floorplanVerification === "verified"
                }
              />
              <LifestylePreferencesForm
                value={prefs}
                onChange={setPrefs}
                compact
              />
            </div>
          ) : (
            <p className="project-empty-note" role="status">
              Chọn loại căn ở trên để đánh giá mức phù hợp.
            </p>
          )}
        </section>

        {/* SECTION 05 — Location */}
        <section className="project-section" id="location">
          <header className="project-section-head">
            <p className="project-section-kicker">05 · Sống ở đây thì sao?</p>
            <h2>Vị trí & tiện ích xung quanh</h2>
            <p>
              Chỉ hiển thị điểm đã xác minh. Thời gian di chuyển chỉ hiện khi có động cơ định tuyến.
            </p>
          </header>

          <div className="location-actions">
            <Link to={`/map?project=${project.slug}`} className="btn btn-primary">
              Xem vị trí
            </Link>
          </div>

          {project.amenities.length > 0 && (
            <ul className="amenity-list amenity-list--inline">
              {project.amenities.map((a) => (
                <li key={`${a.category}-${a.name}`}>
                  <span className="tag">
                    {AMENITY_CATEGORIES.find((c) => c.id === a.category)?.label ?? a.category}
                  </span>{" "}
                  {a.name}
                </li>
              ))}
            </ul>
          )}

          {project.nearbyPlaces.length > 0 ? (
            <ul className="nearby-list">
              {project.nearbyPlaces.map((place) => {
                const categoryLabel =
                  AMENITY_CATEGORIES.find((c) => c.id === place.category)?.label ?? place.category;
                const distance = displayFact(place.distanceKm);
                const travel = displayFact(place.travelTime);
                return (
                  <li key={place.id} className="nearby-item">
                    <div className="nearby-item-header">
                      <strong>{place.name}</strong>
                      <span className="tag tag-teal">{categoryLabel}</span>
                    </div>
                    <dl className="nearby-details">
                      {distance && (
                        <>
                          <dt>Khoảng cách</dt>
                          <dd>{distance}</dd>
                        </>
                      )}
                      {travel ? (
                        <>
                          <dt>Thời gian di chuyển</dt>
                          <dd>{travel}</dd>
                        </>
                      ) : (
                        <>
                          <dt>Thời gian di chuyển</dt>
                          <dd>Chưa có dữ liệu định tuyến</dd>
                        </>
                      )}
                    </dl>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="project-empty-note">
              Chưa có điểm tiện ích đã xác minh kèm khoảng cách cho dự án này.
            </p>
          )}
        </section>

        {/* SECTION 06 — Compare */}
        <section className="project-section" id="compare">
          <header className="project-section-head">
            <p className="project-section-kicker">06 · So sánh trước khi quyết định</p>
            <h2>Đặt cạnh lựa chọn khác</h2>
            <p>Giữ dự án (và căn đang chọn) trong đường dẫn so sánh.</p>
          </header>
          <div className="space-mode-switch">
            <Link to={compareHref} className="btn btn-primary">
              So sánh dự án
            </Link>
            {selectedApt && (
              <Link
                to={`/compare?a=${project.slug}&unit=${selectedApt.slug}`}
                className="btn btn-secondary"
              >
                So sánh căn hộ
              </Link>
            )}
          </div>
        </section>

        {/* SECTION 07 — Sources */}
        <section className="project-section" id="sources">
          <header className="project-section-head">
            <p className="project-section-kicker">07 · Thông tin & nguồn xác minh</p>
            <h2>Nguồn & độ tin cậy</h2>
            <p>AnCư ưu tiên dữ liệu đã xác minh hơn giao diện đầy đủ nhưng không rõ nguồn.</p>
          </header>

          <DataTrustBadge
            sourceClass={project.sourceClass}
            provenance={project.provenance}
            verifiedAt={project.updatedAt}
          />

          {(project.documents?.length ?? 0) > 0 ? (
            <ul className="project-docs-list">
              {project.documents!.map((doc) => (
                <li key={doc.id} className="project-source-item">
                  <div className="project-docs-head">
                    <strong>{doc.title}</strong>
                    <DataTrustBadge compact sourceClass={doc.sourceClass} />
                  </div>
                  {doc.note && <p>{doc.note}</p>}
                  {doc.issuedAt && <p className="project-source-meta">Thời điểm: {doc.issuedAt}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="project-empty-note">Chưa có tài liệu đã xác minh để công bố.</p>
          )}
        </section>
      </div>

      <div className="project-mobile-cta" aria-label="Thao tác nhanh">
        <Link to={exploreHref} className="btn btn-primary">
          Khám phá căn
        </Link>
        <Link to={compareHref} className="btn btn-secondary">
          So sánh
        </Link>
      </div>
    </div>
  );
}
