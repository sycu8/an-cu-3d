# Agent state — AnCư 3D

## Current phase

**Admin + AI Gateway + showroom** complete on the code path. Production secret wiring remains account-side.

Branch: `cursor/admin-ai-showroom-4bd7`

## Packages

- `@ancu/property-web-worker` — showroom UI + Workers API (admin / blog / showroom)
- `@ancu/floorplan-engine` — crawl / convert / publish (admin build bypasses rate limit)
- `@ancu/shared` — tokens, FloorPlanDocument, geometry, trust, AI Gateway, showroom, decision

## Validation (last green)

```bash
pnpm typecheck
pnpm test          # shared 40 · web + engine suites
pnpm build
node scripts/smoke.mjs   # health + blog + admin 401 (+ login when ADMIN_* set)
```

## Shipped (Admin + AI Gateway plan)

- Schema: `project_build_jobs`, `project_build_events`, `blog_posts`, admin auth tables
- Admin UI: list/add project, live job timeline (no client timeout), blog generate, image/2D tools
- Orchestration: name → discover → crawl → synthesize → assets → floorplans → persist → publish
- AI Gateway client (`research` / `blog` / `image_*` / `vision_2d` / `qa_factual`) + deterministic fallbacks
- Public blog + Monday cron draft-only
- Showroom lighting / materials / hotspots / `buildShowroomSharePath`

## Needs your Cloudflare account

1. Create D1 / R2 / Queues; replace placeholder IDs in wrangler configs
2. Apply migrations through `0004_admin_auth.sql` on property D1
3. GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
4. Optional AI Gateway secrets on property-web; `ENGINE_API_SECRET` on both Workers
5. Smoke: `WEB_BASE_URL=… ENGINE_BASE_URL=… ADMIN_USER=… ADMIN_PASSWORD=… node scripts/smoke.mjs`
6. Run Actions → **deploy** workflow (manual dispatch)

## Optional user-facing upgrades (suggestions only)

- Official CĐT floor-plan URLs → richer crawl → project-specific verified FloorPlanDocuments
- Real amenity POI feed (OpenStreetMap Overpass) for denser map detail
- Travel-time via a licensed routing API (never invent times)
- Admin review UI for uncertain openings/walls
