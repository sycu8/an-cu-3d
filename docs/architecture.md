# AnCư 3D — Architecture (P1)

## Product split

| App | Package | Role |
| --- | --- | --- |
| Property experience | `@ancu/property-web-worker` | Public React+TS UI, project/map/apartment APIs, Workers Assets |
| Floor-plan engine | `@ancu/floorplan-engine` | Internal crawl → convert → validate → publish (no UI product surface) |
| Shared | `@ancu/shared` | Design tokens, Zod FloorPlanDocument schema, domain types |

Floor-plan conversion logic stays out of the frontend. The web app **consumes** published `FloorPlanDocument` JSON (R2) + D1 metadata.

## Runtime diagram

```text
Browser
  │
  ▼
property-web-worker (Workers + Assets)
  ├── D1  DB              → projects, buildings, units, POIs, media meta
  ├── R2  ASSETS          → project media, published floorplan keys (read)
  ├── Images IMAGES       → resize/optimize media from R2 bytes
  ├── Cache API           → CDN-ish responses for public reads
  └── service binding?    → optional internal calls to engine (admin only)

ancu-floorplan-engine (Workers, internal)
  ├── D1  ENGINE_DB       → sources, jobs, reviews, version meta
  ├── R2  FLOORPLANS      → raw/normalized/analysis/geometry/previews/published
  ├── Queue CONVERSION_QUEUE / CRAWL_QUEUE
  ├── Workflow CONVERSION_WORKFLOW  → durable multi-step pipeline
  ├── AI                  → cascaded Workers AI (classifier → vision)
  ├── BROWSER (optional)  → Cloudflare Browser Rendering for allowlisted crawl
  └── AI Gateway (opt)    → observability/routing when justified
```

## Binding names (locked for P3)

### `property-web-worker` (`ancu-property-web`)

| Binding | Type | Resource name (logical) | Use |
| --- | --- | --- | --- |
| `DB` | D1 | `ancu-property-db` | Queryable product metadata |
| `ASSETS` | R2 | `ancu-property-assets` | Project images + published artifact pointers |
| `IMAGES` | Images | — | Resize/optimize R2 image bytes at the media edge |
| `ENGINE` | Service (optional) | `ancu-floorplan-engine` | Internal admin proxy only |

### `ancu-floorplan-engine` (`ancu-floorplan-engine`)

| Binding | Type | Resource name (logical) | Use |
| --- | --- | --- | --- |
| `ENGINE_DB` | D1 | `ancu-engine-db` | Crawl/conversion/review metadata |
| `FLOORPLANS` | R2 | `ancu-floorplans` | Versioned floor-plan objects |
| `CONVERSION_QUEUE` | Queue | `ancu-conversion` | Buffer/retry conversion work |
| `CRAWL_QUEUE` | Queue | `ancu-crawl` | Buffer/retry crawl work |
| `CONVERSION_WORKFLOW` | Workflow | `ancu-conversion-workflow` | Durable pipeline steps |
| `AI` | Workers AI | — | Classification + vision cascade |
| `BROWSER` | Browser Rendering | — | Allowlisted source capture |

No account IDs, database IDs, or secrets in git. Wrangler uses env-specific IDs via CI secrets / `.dev.vars`.

## Environments

| Env | Purpose |
| --- | --- |
| `local` | `wrangler dev` + local D1/R2 emulation |
| `preview` | PR / staging Worker names + isolated D1/R2 |
| `production` | Live public web; engine remains auth-gated |

Config format: **`wrangler.jsonc`** per app (P3).

## Data ownership

- **D1**: developers, projects, buildings, apartment_types, amenities, nearby_places, media meta, sources, crawl/conversion jobs, review status, published version pointers.
- **R2**: images, FloorPlanDocument JSON (SoT), analysis artifacts, GLB (derived cache), furniture, textures.
- **Source of truth for apartments**: `FloorPlanDocument` JSON — not GLB.

## Frontend stack (locked)

- React + TypeScript
- Three.js + React Three Fiber + Drei
- MapLibre GL JS behind a map-provider abstraction
- Route-level code splitting; R3F lazy-loaded

## Routes (product)

```text
/
/projects
/projects/:slug
/projects/:slug/3d
/projects/:slug/apartments
/projects/:slug/apartments/:unit
/map
/compare
```

URL state: `?building=` `?view=` `?room=` `?category=` `?destination=`

## Engine HTTP surface (internal)

```text
POST /jobs  GET /jobs/:id  GET /jobs/:id/result
POST /jobs/:id/retry|approve|reject
POST /sources/crawl  GET /sources/crawl/:id
POST /floorplans/:id/publish
```

Job create returns quickly; work runs on Queue/Workflow.

## Security principles

- Engine endpoints are internal (secret / Access / service binding).
- No unrestricted URL fetcher; domain allowlist + SSRF guards.
- No public R2 write; no secrets in frontend bundles.


## Admin + AI Gateway (P30+)

- **Admin UI** (`/admin`): Bearer `ADMIN_SECRET`; add project by name → crawl/synthesize/publish with live stage timing (no rate limit / timeout on this path).
- **AI Gateway**: multi-model routing in `@ancu/shared` (`research`, `blog`, `image_gen`, `image_edit`, `vision_2d`, `qa_factual`) with Workers AI fallback.
- **Blog** (`/blog`): weekly draft generation from existing projects; Vietnamese primary.
- **Showroom** (`/projects/:slug/showroom`): lighting presets, material palettes (incl. photo-derived), room hotspots, shareable `?unit=&preset=&palette=` link.
- **Admin tools**: weekly blog draft (cron, never auto-publish), image gen/edit, 2D→3D assist, factual QA on build, `POST /api/admin/projects/approve-all`.
- **Engine**: `POST /jobs` rate limit bypassed when `X-AnCu-Admin-Build: 1` or `bypassRateLimit: true`.
