import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { getProjectSummaries, getProjectBySlug } from "../data/gamuda-projects";
import type { ProjectSummary } from "../types";
import "./ComparePage.css";

const MAX_COMPARE = 3;

function CompareRow({
  label,
  values,
}: {
  label: string;
  values: (string | undefined)[];
}) {
  return (
    <tr>
      <th>{label}</th>
      {values.map((v, i) => (
        <td key={i} className={v === "Data pending verification" ? "pending-data" : ""}>
          {v ?? "—"}
        </td>
      ))}
    </tr>
  );
}

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const allProjects = getProjectSummaries();

  const selectedSlugs = useMemo(() => {
    const fromUrl = [
      searchParams.get("a"),
      searchParams.get("b"),
      searchParams.get("c"),
    ].filter(Boolean) as string[];
    if (fromUrl.length > 0) return fromUrl.slice(0, MAX_COMPARE);
    return allProjects.slice(0, 2).map((p) => p.slug);
  }, [searchParams, allProjects]);

  const [picker, setPicker] = useState("");

  const compared: ProjectSummary[] = selectedSlugs
    .map((slug) => getProjectBySlug(slug))
    .filter(Boolean)
    .map((p) => ({
      id: p!.id,
      slug: p!.slug,
      name: p!.name,
      tagline: p!.tagline,
      city: p!.city,
      district: p!.district,
      developerName: p!.developerName,
      handover: p!.handover,
      priceRange: p!.priceRange,
      totalUnits: p!.totalUnits,
      latitude: p!.latitude,
      longitude: p!.longitude,
      sourceClass: p!.sourceClass,
      provenance: p!.provenance,
      confidence: p!.confidence,
    }));

  const addProject = (slug: string) => {
    if (!slug || selectedSlugs.includes(slug) || selectedSlugs.length >= MAX_COMPARE) return;
    const next = [...selectedSlugs, slug];
    setSearchParams({ a: next[0], b: next[1] ?? "", c: next[2] ?? "" });
    setPicker("");
  };

  const removeProject = (slug: string) => {
    const next = selectedSlugs.filter((s) => s !== slug);
    const params: Record<string, string> = {};
    if (next[0]) params.a = next[0];
    if (next[1]) params.b = next[1];
    if (next[2]) params.c = next[2];
    setSearchParams(params);
  };

  const available = allProjects.filter((p) => !selectedSlugs.includes(p.slug));

  return (
    <div className="container compare-page">
      <header className="page-header">
        <h1>So sánh dự án</h1>
        <p>Chọn tối đa {MAX_COMPARE} dự án để so sánh song song.</p>
      </header>

      <div className="compare-picker">
        <select
          value={picker}
          onChange={(e) => setPicker(e.target.value)}
          disabled={selectedSlugs.length >= MAX_COMPARE}
        >
          <option value="">+ Thêm dự án</option>
          {available.map((p) => (
            <option key={p.id} value={p.slug}>{p.name}</option>
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
      </div>

      {compared.length < 2 ? (
        <p className="compare-hint">Chọn ít nhất 2 dự án để so sánh.</p>
      ) : (
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th />
                {compared.map((p) => (
                  <th key={p.id}>
                    <div className="compare-project-header">
                      <Link to={`/projects/${p.slug}`}>{p.name}</Link>
                      <button
                        type="button"
                        className="compare-remove"
                        onClick={() => removeProject(p.slug)}
                        aria-label={`Remove ${p.name}`}
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
              <CompareRow label="Nhà phát triển" values={compared.map((p) => p.developerName)} />
              <CompareRow label="Quận" values={compared.map((p) => p.district)} />
              <CompareRow label="Giá" values={compared.map((p) => p.priceRange)} />
              <CompareRow label="Bàn giao" values={compared.map((p) => p.handover)} />
              <CompareRow label="Quy mô" values={compared.map((p) => p.totalUnits)} />
              <CompareRow
                label="Tin cậy"
                values={compared.map((p) =>
                  p.confidence != null ? `${Math.round(p.confidence * 100)}%` : "—",
                )}
              />
              <CompareRow label="Nguồn" values={compared.map((p) => p.provenance)} />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
