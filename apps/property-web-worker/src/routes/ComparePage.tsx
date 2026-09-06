import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  parsePriceMidTrieu,
  preferredBedrooms,
  rankProjects,
  type LifestylePreferences,
  type ProjectScoreCandidate,
} from "@ancu/shared";
import { CompareInfographic } from "../components/CompareInfographic";
import { LifestylePreferencesForm } from "../components/LifestylePreferencesForm";
import { PageSkeleton } from "../components/PageSkeleton";
import { useProjectSummaries } from "../hooks/useProjects";
import { fetchProject } from "../lib/api";
import { loadLifestylePreferences } from "../lib/lifestylePreferences";
import type { ProjectDetail, ProjectSummary } from "../types";
import "./ComparePage.css";

const MAX_COMPARE = 3;

function displayFact(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed || "—";
}

function CompareRow({
  label,
  values,
}: {
  label: string;
  values: (string | undefined)[];
}) {
  return (
    <tr>
      <th scope="row">{label}</th>
      {values.map((v, i) => (
        <td key={i}>{displayFact(v)}</td>
      ))}
    </tr>
  );
}

function bedroomMatchScore(
  bedrooms: number | undefined,
  prefs: LifestylePreferences,
): number | null {
  if (bedrooms == null || !Number.isFinite(bedrooms)) return null;
  const target = preferredBedrooms(prefs.household);
  if (bedrooms >= target) return bedrooms === target ? 1 : 0.9;
  if (bedrooms === target - 1) return 0.55;
  return 0.25;
}

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useProjectSummaries();
  const [picker, setPicker] = useState("");
  const [prefs, setPrefs] = useState<LifestylePreferences>(() =>
    loadLifestylePreferences(),
  );
  const [details, setDetails] = useState<Record<string, ProjectDetail>>({});

  const allProjects = "data" in state && state.data ? state.data : [];
  const unitSlug = searchParams.get("unit") ?? undefined;

  const selectedSlugs = useMemo(() => {
    const fromUrl = [
      searchParams.get("a"),
      searchParams.get("b"),
      searchParams.get("c"),
    ].filter(Boolean) as string[];
    if (fromUrl.length > 0) return fromUrl.slice(0, MAX_COMPARE);
    return allProjects.slice(0, 2).map((p) => p.slug);
  }, [searchParams, allProjects]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next: Record<string, ProjectDetail> = { ...details };
      for (const slug of selectedSlugs) {
        if (next[slug]) continue;
        try {
          next[slug] = await fetchProject(slug);
        } catch {
          // seed fallback via summaries only
        }
      }
      if (!cancelled) setDetails(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only refetch missing slugs
  }, [selectedSlugs.join("|")]);

  if (state.status === "loading") return <PageSkeleton />;

  if (state.status === "error" && !allProjects.length) {
    return (
      <div className="container page-header">
        <h1>So sánh trước khi quyết định</h1>
        <p role="alert">{state.error}</p>
      </div>
    );
  }

  const compared: ProjectSummary[] = selectedSlugs
    .map((slug) => allProjects.find((p) => p.slug === slug))
    .filter((p): p is ProjectSummary => Boolean(p));

  const updateUrl = (slugs: string[], unit?: string) => {
    const params: Record<string, string> = {};
    if (slugs[0]) params.a = slugs[0];
    if (slugs[1]) params.b = slugs[1];
    if (slugs[2]) params.c = slugs[2];
    if (unit) params.unit = unit;
    setSearchParams(params);
  };

  const addProject = (slug: string) => {
    if (!slug || selectedSlugs.includes(slug) || selectedSlugs.length >= MAX_COMPARE) return;
    updateUrl([...selectedSlugs, slug], unitSlug);
    setPicker("");
  };

  const removeProject = (slug: string) => {
    updateUrl(
      selectedSlugs.filter((s) => s !== slug),
      unitSlug,
    );
  };

  const available = allProjects.filter((p) => !selectedSlugs.includes(p.slug));

  const unitRows = compared.map((p) => {
    const detail = details[p.slug];
    const apt =
      detail?.apartmentTypes.find((a) => a.slug === unitSlug) ??
      detail?.apartmentTypes[0];
    return { project: p, apt, detail };
  });

  const candidates: ProjectScoreCandidate[] = compared.map((p) => {
    const detail = details[p.slug];
    const apt =
      detail?.apartmentTypes.find((a) => a.slug === unitSlug) ??
      detail?.apartmentTypes[0];
    const schoolPoiCount =
      detail?.nearbyPlaces.filter((n) =>
        /school|education|học|trường/i.test(`${n.category} ${n.name}`),
      ).length ?? 0;
    const amenityPoiCount = detail?.nearbyPlaces.length ?? 0;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      pricePerSqmMid: parsePriceMidTrieu(p.priceRange),
      spaceScore: bedroomMatchScore(apt?.bedrooms, prefs),
      latitude: p.latitude,
      longitude: p.longitude,
      schoolPoiCount,
      amenityPoiCount,
    };
  });

  const ranked =
    compared.length >= 2
      ? rankProjects(candidates, prefs.weights, prefs.commuteDestination ?? null)
      : [];

  return (
    <div className="container compare-page">
      <header className="page-header">
        <h1>So sánh trước khi quyết định</h1>
        <p>
          So sánh dự án và loại căn trên dữ liệu đã có. Điểm xếp hạng chỉ dùng tiêu chí có số liệu —
          không bịa thời gian di chuyển hay giá.
        </p>
      </header>

      <div className="compare-layout">
        <div className="compare-main">
          <div className="compare-picker">
            <select
              value={picker}
              onChange={(e) => setPicker(e.target.value)}
              disabled={selectedSlugs.length >= MAX_COMPARE}
              aria-label="Thêm dự án để so sánh"
            >
              <option value="">+ Thêm dự án</option>
              {available.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!picker}
              onClick={() => addProject(picker)}
            >
              Thêm
            </button>
            {unitSlug && (
              <p className="compare-unit-chip">
                Đang giữ loại căn: <strong>{unitSlug}</strong>
              </p>
            )}
          </div>

          {compared.length < 2 ? (
            <p className="compare-hint">Chọn ít nhất 2 dự án để so sánh.</p>
          ) : (
            <>
              <CompareInfographic projects={compared} />

              {ranked.some((r) => r.result.sufficient) && (
                <section className="compare-ranking" aria-label="Xếp hạng theo ưu tiên">
                  <h2>Xếp hạng theo ưu tiên của bạn</h2>
                  <ol>
                    {ranked.map((r) => (
                      <li key={r.candidate.id}>
                        <Link to={`/projects/${r.candidate.slug}`}>
                          {r.candidate.name}
                        </Link>
                        <span>
                          {r.result.overall != null ? `${r.result.overall}/100` : "Thiếu dữ liệu"}
                        </span>
                        <p>{r.result.explainVi}</p>
                        {r.commuteDistanceKm != null && (
                          <p className="compare-commute">
                            Khoảng cách đường chim bay tới điểm đã lưu:{" "}
                            {r.commuteDistanceKm.toFixed(1)} km
                            {prefs.commuteLabel ? ` (${prefs.commuteLabel})` : ""}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              <div className="compare-table-wrap">
                <table className="compare-table">
                  <thead>
                    <tr>
                      <th scope="col" />
                      {compared.map((p) => (
                        <th key={p.id} scope="col">
                          <div className="compare-project-header">
                            <Link to={`/projects/${p.slug}`}>{p.name}</Link>
                            <button
                              type="button"
                              className="compare-remove"
                              onClick={() => removeProject(p.slug)}
                              aria-label={`Gỡ ${p.name}`}
                            >
                              ×
                            </button>
                          </div>
                          <span className="tag">{p.district}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <CompareRow
                      label="Chủ đầu tư"
                      values={compared.map((p) => p.developerName)}
                    />
                    <CompareRow label="Quận" values={compared.map((p) => p.district)} />
                    <CompareRow label="Giá" values={compared.map((p) => p.priceRange)} />
                    <CompareRow label="Bàn giao" values={compared.map((p) => p.handover)} />
                    <CompareRow label="Quy mô" values={compared.map((p) => p.totalUnits)} />
                    <CompareRow
                      label="Loại căn"
                      values={unitRows.map(({ apt }) => apt?.name)}
                    />
                    <CompareRow
                      label="Phòng ngủ"
                      values={unitRows.map(({ apt }) =>
                        apt?.bedrooms != null ? String(apt.bedrooms) : undefined,
                      )}
                    />
                    <CompareRow
                      label="Diện tích"
                      values={unitRows.map(({ apt }) => apt?.areaSqm)}
                    />
                    <CompareRow
                      label="Mặt bằng"
                      values={unitRows.map(({ apt }) => apt?.floorplanVerification)}
                    />
                    <CompareRow
                      label="Điểm ưu tiên"
                      values={ranked.map((r) =>
                        r.result.overall != null ? `${r.result.overall}/100` : undefined,
                      )}
                    />
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <aside className="compare-sidebar" aria-label="Ưu tiên quyết định">
          <h2>Ưu tiên của bạn</h2>
          <p className="compare-sidebar-note">
            Lưu trên trình duyệt — không tạo tài khoản. Điểm chỉ dùng dữ liệu đã có.
          </p>
          <LifestylePreferencesForm value={prefs} onChange={setPrefs} compact />
        </aside>
      </div>
    </div>
  );
}
