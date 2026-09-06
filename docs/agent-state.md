# Agent state — AnCư 3D

## Current phase

**M4 + Admin/AI Gateway in progress** — P0–P29 done (perf, security/observability, production wiring).

Branch: `cursor/admin-ai-gateway-4bd7` (from mvp-build) · PR: https://github.com/sycu8/an-cu-3d/pull/2

## Packages

- `@ancu/property-web-worker` — showroom UI + Workers API
- `@ancu/floorplan-engine` — crawl/convert/publish
- `@ancu/shared` — tokens, FloorPlanDocument, geometry, R2 paths

## Validation (last green)

```bash
pnpm -r test          # shared 7 · engine 20 · web 8
pnpm -r typecheck
pnpm --filter @ancu/property-web-worker build
pnpm --filter @ancu/floorplan-engine build
```

## Needs your Cloudflare account (cannot finish without secrets)

1. Create D1 / R2 / Queues; replace placeholder IDs in wrangler configs
2. GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
3. `wrangler secret put ENGINE_API_SECRET` for the engine
4. Optional repo vars for smoke: `WEB_BASE_URL`, `ENGINE_BASE_URL`
5. Run Actions → **deploy** workflow (manual dispatch)

## Optional user-facing upgrades (suggestions only)

- Official Gamuda floor-plan URLs → richer crawl → more exact unit geometry
- Real amenity POI feed (OpenStreetMap Overpass) for denser map detail
- Further 3D LOD / Draco for lower mobile GPU cost
- Travel-time via a licensed routing API (never invent times)


## New secrets for Admin / AI Gateway

- `ADMIN_SECRET` on property-web (admin Bearer)
- `AI_GATEWAY_ACCOUNT_ID`, `AI_GATEWAY_ID`, `AI_GATEWAY_TOKEN` (optional; deterministic fallback without them)
- `ENGINE_BASE_URL` + `ENGINE_API_SECRET` on property-web for engine crawl enrichment

- Admin + AI Gateway + showroom plan: schema/auth/jobs, admin UI, orchestration, AI Gateway client, blog+cron, image/2D assist, showroom share link, deploy secrets docs.

- Media: R2 object storage (`ASSETS`) + Cloudflare Images resize via `GET /api/media/*`.
