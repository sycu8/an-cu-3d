import type { ProjectDetail, ProjectSummary } from "../../types";

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  handover: string | null;
  price_range: string | null;
  total_units: string | null;
  status: string;
  source_class: string;
  provenance: string | null;
  confidence: number | null;
  research_json: string | null;
  cover_r2_key: string | null;
  published_at: string | null;
  showroom_json: string | null;
  updated_at?: string | null;
  developer_name?: string;
};

const PENDING = "Chờ xác minh";

export async function ensureGamudaDeveloper(db: D1Database): Promise<string> {
  const id = "dev_gamuda_land";
  await db
    .prepare(
      `INSERT OR IGNORE INTO developers (id, slug, name, website, source_class, provenance)
       VALUES (?, 'gamuda-land', 'Gamuda Land', 'https://www.gamudaland.com.vn', 'verified_public', 'Public developer website')`,
    )
    .bind(id)
    .run();
  return id;
}

export async function listDbProjectSummaries(db: D1Database): Promise<ProjectSummary[]> {
  const rows = await db
    .prepare(
      `SELECT p.*, d.name AS developer_name
       FROM projects p
       JOIN developers d ON d.id = p.developer_id
       WHERE p.status IN ('active', 'published', 'draft')
       ORDER BY p.updated_at DESC`,
    )
    .all<ProjectRow>();

  return (rows.results ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline ?? undefined,
    city: p.city ?? undefined,
    district: p.district ?? undefined,
    developerName: p.developer_name ?? "Gamuda Land",
    handover: p.handover ?? PENDING,
    priceRange: p.price_range ?? PENDING,
    totalUnits: p.total_units ?? PENDING,
    latitude: p.latitude ?? undefined,
    longitude: p.longitude ?? undefined,
    sourceClass: p.source_class,
    provenance: p.provenance ?? undefined,
    confidence: p.confidence ?? undefined,
    status: p.status,
    updatedAt: p.updated_at ?? undefined,
    coverR2Key: p.cover_r2_key ?? undefined,
    coverUrl: p.cover_r2_key
      ? `/api/media/${p.cover_r2_key}?v=card&f=webp`
      : undefined,
  }));
}

export async function getDbProjectBySlug(
  db: D1Database,
  slug: string,
): Promise<ProjectDetail | null> {
  const p = await db
    .prepare(
      `SELECT p.*, d.name AS developer_name
       FROM projects p
       JOIN developers d ON d.id = p.developer_id
       WHERE p.slug = ?`,
    )
    .bind(slug)
    .first<ProjectRow>();
  if (!p) return null;

  const amenities = await db
    .prepare(`SELECT category, name FROM amenities WHERE project_id = ?`)
    .bind(p.id)
    .all<{ category: string; name: string }>();

  const apartments = await db
    .prepare(`SELECT * FROM apartment_types WHERE project_id = ?`)
    .bind(p.id)
    .all<{
      id: string;
      slug: string;
      name: string;
      bedrooms: number | null;
      bathrooms: number | null;
      area_sqm: string | null;
      price: string | null;
      floorplan_key: string | null;
      source_class: string;
      provenance: string | null;
      confidence: number | null;
      validation_summary: string | null;
    }>();

  const nearby = await db
    .prepare(`SELECT * FROM nearby_places WHERE project_id = ?`)
    .bind(p.id)
    .all<{
      id: string;
      category: string;
      name: string;
      latitude: number | null;
      longitude: number | null;
      distance_km: string | null;
      travel_time: string | null;
      source_class: string;
    }>();

  const media = await listProjectMedia(db, p.id);

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    tagline: p.tagline ?? undefined,
    description: p.description ?? undefined,
    city: p.city ?? undefined,
    district: p.district ?? undefined,
    address: p.address ?? undefined,
    developerName: p.developer_name ?? "Gamuda Land",
    handover: p.handover ?? PENDING,
    priceRange: p.price_range ?? PENDING,
    totalUnits: p.total_units ?? PENDING,
    latitude: p.latitude ?? undefined,
    longitude: p.longitude ?? undefined,
    sourceClass: p.source_class,
    provenance: p.provenance ?? undefined,
    confidence: p.confidence ?? undefined,
    amenities: (amenities.results ?? []).map((a) => ({
      category: a.category,
      name: a.name,
    })),
    apartmentTypes: (apartments.results ?? []).map((a) => ({
      id: a.id,
      slug: a.slug,
      name: a.name,
      bedrooms: a.bedrooms ?? undefined,
      bathrooms: a.bathrooms ?? undefined,
      areaSqm: a.area_sqm ?? PENDING,
      price: a.price ?? PENDING,
      floorplanKey: a.floorplan_key ?? undefined,
      sourceClass: a.source_class,
      provenance: a.provenance ?? undefined,
      confidence: a.confidence ?? undefined,
      validationSummary: a.validation_summary ?? undefined,
    })),
    nearbyPlaces: (nearby.results ?? []).map((n) => ({
      id: n.id,
      category: n.category,
      name: n.name,
      latitude: n.latitude ?? undefined,
      longitude: n.longitude ?? undefined,
      distanceKm: n.distance_km ?? PENDING,
      travelTime: n.travel_time ?? PENDING,
      sourceClass: n.source_class,
    })),
    status: p.status,
    updatedAt: p.updated_at ?? undefined,
    showroom: parseShowroomJson(p.showroom_json),
    coverR2Key: p.cover_r2_key ?? undefined,
    coverUrl: p.cover_r2_key
      ? `/api/media/${p.cover_r2_key}?v=hero&f=webp`
      : undefined,
    media,
  };
}

function parseShowroomJson(raw: string | null): ProjectDetail["showroom"] | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as ProjectDetail["showroom"];
  } catch {
    return undefined;
  }
}

export type SynthesizedProject = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  city: string;
  district: string;
  address: string;
  latitude?: number;
  longitude?: number;
  handover: string;
  priceRange: string;
  totalUnits: string;
  amenities: { category: string; name: string }[];
  apartmentTypes: {
    slug: string;
    name: string;
    bedrooms: number;
    bathrooms: number;
    areaSqm: string;
    floorplanKey?: string;
  }[];
  nearbyPlaces: { category: string; name: string }[];
  sources: { label: string; url: string }[];
  researchNotes: string;
  showroom: {
    lightingDefault: string;
    materialPaletteLabel: string;
    hotspots: { roomHint: string; label: string; order: number }[];
    materialFromPhoto?: {
      floor: string;
      wall: string;
      cabinet: string;
      accent: string;
      notes?: string;
    };
  };
};

export async function upsertSynthesizedProject(
  db: D1Database,
  data: SynthesizedProject,
): Promise<string> {
  const developerId = await ensureGamudaDeveloper(db);
  const projectId = `proj_${data.slug}`;

  await db
    .prepare(
      `INSERT INTO projects (
         id, developer_id, slug, name, tagline, description, city, district, address,
         latitude, longitude, handover, price_range, total_units, status, source_class,
         provenance, confidence, research_json, published_at, showroom_json, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 'estimated', ?, ?, ?, datetime('now'), ?, datetime('now'))
       ON CONFLICT(slug) DO UPDATE SET
         name = excluded.name,
         tagline = excluded.tagline,
         description = excluded.description,
         city = excluded.city,
         district = excluded.district,
         address = excluded.address,
         latitude = excluded.latitude,
         longitude = excluded.longitude,
         handover = excluded.handover,
         price_range = excluded.price_range,
         total_units = excluded.total_units,
         status = 'published',
         provenance = excluded.provenance,
         confidence = excluded.confidence,
         research_json = excluded.research_json,
         published_at = datetime('now'),
         showroom_json = excluded.showroom_json,
         updated_at = datetime('now')`,
    )
    .bind(
      projectId,
      developerId,
      data.slug,
      data.name,
      data.tagline,
      data.description,
      data.city,
      data.district,
      data.address,
      data.latitude ?? null,
      data.longitude ?? null,
      data.handover,
      data.priceRange,
      data.totalUnits,
      data.researchNotes,
      0.45,
      JSON.stringify({ notes: data.researchNotes, sources: data.sources }),
      JSON.stringify(data.showroom),
    )
    .run();

  await db.prepare(`DELETE FROM amenities WHERE project_id = ?`).bind(projectId).run();
  for (const a of data.amenities) {
    await db
      .prepare(
        `INSERT INTO amenities (id, project_id, category, name, source_class, provenance)
         VALUES (?, ?, ?, ?, 'estimated', 'AI multi-source synthesis')`,
      )
      .bind(crypto.randomUUID(), projectId, a.category, a.name)
      .run();
  }

  await db.prepare(`DELETE FROM apartment_types WHERE project_id = ?`).bind(projectId).run();
  for (const apt of data.apartmentTypes) {
    await db
      .prepare(
        `INSERT INTO apartment_types (
           id, project_id, slug, name, bedrooms, bathrooms, area_sqm, floorplan_key,
           price, source_class, provenance, confidence, validation_summary
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'estimated', 'Liên kết mẫu — đã duyệt hiển thị; số liệu vẫn Chờ xác minh nếu thiếu nguồn', 0.35, 'Chờ số liệu công bố')`,
      )
      .bind(
        crypto.randomUUID(),
        projectId,
        apt.slug,
        apt.name,
        apt.bedrooms,
        apt.bathrooms,
        apt.areaSqm,
        apt.floorplanKey ?? null,
        PENDING,
      )
      .run();
  }

  await db.prepare(`DELETE FROM nearby_places WHERE project_id = ?`).bind(projectId).run();
  for (const n of data.nearbyPlaces) {
    await db
      .prepare(
        `INSERT INTO nearby_places (
           id, project_id, category, name, distance_km, travel_time, source_class, provenance
         ) VALUES (?, ?, ?, ?, ?, ?, 'estimated', 'Tổng hợp AI — đã duyệt hiển thị; số liệu vẫn Chờ xác minh nếu thiếu nguồn')`,
      )
      .bind(crypto.randomUUID(), projectId, n.category, n.name, PENDING, PENDING)
      .run();
  }

  await db.prepare(`DELETE FROM project_sources WHERE project_id = ?`).bind(projectId).run();
  for (const s of data.sources) {
    await db
      .prepare(
        `INSERT INTO project_sources (
           id, project_id, source_type, source_url, source_label, retrieved_at, source_class, provenance
         ) VALUES (?, ?, 'web', ?, ?, datetime('now'), 'estimated', 'Admin crawl pipeline')`,
      )
      .bind(crypto.randomUUID(), projectId, s.url, s.label)
      .run();
  }

  return projectId;
}


export async function updateProjectCoverR2Key(
  db: D1Database,
  slug: string,
  coverR2Key: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE projects
       SET cover_r2_key = ?, updated_at = datetime('now')
       WHERE slug = ?`,
    )
    .bind(coverR2Key, slug)
    .run();
}


type ProjectMediaRow = {
  id: string;
  kind: string;
  url: string | null;
  r2_key: string | null;
  alt_text: string | null;
  sort_order: number | null;
  source_class: string;
  provenance: string | null;
};

export async function listProjectMedia(
  db: D1Database,
  projectId: string,
): Promise<import("../../types").ProjectMediaItem[]> {
  try {
    const rows = await db
      .prepare(
        `SELECT id, kind, url, r2_key, alt_text, sort_order, source_class, provenance
         FROM project_media
         WHERE project_id = ?
         ORDER BY sort_order ASC, created_at ASC`,
      )
      .bind(projectId)
      .all<ProjectMediaRow>();
    return (rows.results ?? []).map((row) => ({
      id: row.id,
      kind: row.kind as import("../../types").ProjectMediaItem["kind"],
      url: row.url,
      r2Key: row.r2_key,
      altText: row.alt_text,
      sortOrder: row.sort_order ?? 0,
      sourceClass: row.source_class,
      provenance: row.provenance,
    }));
  } catch {
    return [];
  }
}
