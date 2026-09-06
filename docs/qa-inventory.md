# QA inventory — AnCư 3D property web

Production-like local pass. No production deploy, real PII, or destructive cloud actions without explicit approval.

## Environment

| Setting | Local value |
| --- | --- |
| Seed inventory | `ALL_SEED_PROJECTS` = Gamuda public stubs + sanitized `demo-*` fixtures |
| D1 merge | Worker `GET /api/projects` merges D1 over seed by slug |
| Admin auth | Bearer `ADMIN_SECRET` from `.dev.vars` |
| AI Gateway | Optional; UI works without tokens |
| Pricing / area / handover | Always `"Chờ xác minh"` unless verified + provenance |

## Roles

| Role | Surfaces | Notes |
| --- | --- | --- |
| Anonymous visitor | Home, projects, detail, 3D, apartments, viewer, map, compare, blog, showroom | API-first with seed fallback |
| Admin operator | `/admin` | Requires Bearer secret; build jobs + blog draft |

No other roles (no buyer login, no agent CRM).

## Routes & acceptance criteria

### `/` Home

- **Controls:** CTA to projects + map; featured project cards.
- **States:** loading skeleton; error if API+seed empty; ready with `source` label.
- **AC:** Brand/hero present; ≤6 featured cards; pending fields styled; no fabricated prices.
- **Edges:** API down → seed; empty list copy.

### `/projects`

- **Controls:** Project cards (detail / 3D).
- **AC:** Shows merged inventory + source; includes seed demos and D1-only slugs when API up.
- **Edges:** Zero projects; slow API (skeleton).

### `/projects/:slug`

- **Controls:** Links to 3D, apartments, showroom, map, compare; apartment type links; nearby list.
- **AC:** Unknown slug → not-found; showroom CTA present; pending nearby travel time labeled.
- **Edges:** D1-only slug via API; seed-only when API 404.

### `/projects/:slug/3d`

- **Controls:** Orbit canvas; links to apartments / showroom / map.
- **AC:** Schematic only; labeled non-photoreal.
- **Edges:** Missing slug → not-found.

### `/projects/:slug/apartments`

- **Controls:** Unit type cards.
- **AC:** Lists `apartmentTypes`; pending area styled.
- **Edges:** Empty types → empty grid (no crash).

### `/projects/:slug/apartments/:unit`

- **Controls:** 3D viewer; QA overlay opacity.
- **AC:** Resolves via `floorplanKey` then unit slug; QA metadata shown.
- **Edges:** Unknown unit → not-found; unknown key falls back to studio sample.

### `/projects/:slug/showroom`

- **Controls:** Unit / lighting / palette selects (URL params); room hotspot buttons.
- **AC:** Shareable `unit`, `preset`, `palette` query params; hotspot toggles focus.
- **Edges:** Invalid preset/palette → defaults; missing project → not-found.

### `/map`

- **Controls:** Amenity category filters; destination select; project chips; map.
- **AC:** Project markers from API/seed; POIs with coordinates; straight-line km when coords exist; travel time always pending copy.
- **Edges:** Missing lat/lng omitted; filters hide POIs; `?project=` focuses project.

### `/compare`

- **Controls:** Add select + button; remove; URL `a`/`b`/`c` (max 3).
- **AC:** Needs ≥2 columns; pending cells styled; deep-link from detail works.
- **Edges:** Max 3 disables add; unknown slug ignored; single selection shows hint.

### `/blog`, `/blog/:slug`

- **Controls:** Post list / post body.
- **AC:** Empty published list OK; unpublished slug 404.
- **Edges:** Markdown may render raw (known limitation).

### `/admin`

- **Controls:** Secret input; add project by name; refresh jobs; blog draft generate.
- **AC:** 401 without secret; job list when authorized; build path not rate-limited.
- **Edges:** Empty name rejected; missing AI → graceful error.

## Shared API

| Endpoint | AC | Edge |
| --- | --- | --- |
| `GET /api/health` | ok + db + security headers | DB unavailable reflected |
| `GET /api/projects` | seed ∪ D1 by slug | D1 error → seed only |
| `GET /api/projects/:slug` | D1 prefer, else seed | unknown → 404 |
| `GET /api/blog` | published posts | DB fail → `[]` |
| Admin mutating | Bearer required | missing secret → 401 |

## Workflows

1. Discover → detail → apartments → 3D viewer → QA panel.
2. Detail → showroom → change lighting/palette → share URL.
3. Detail → map with `?project=` → filter POI → straight-line distance.
4. Detail → compare → add third → remove.
5. Admin → authorize → create project name → observe job (when engine/AI configured).
6. D1-only project appears on `/projects` and opens detail (API merge).

## Finite risk-based edge cases

- API failure mid-session → seed fallback without blank screen.
- Duplicate slug: D1 overrides seed fields.
- Pending verification never replaced with invented numbers.
- Admin secret not logged in client console responses.
