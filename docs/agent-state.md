# Agent state — AnCư 3D

## Current phase

**Property decision platform** — P0 trust + Grand Park UX + floorplan fidelity foundations.

Branch: `cursor/property-decision-platform-e176`

## Packages

- `@ancu/property-web-worker` — showroom UI + Workers API
- `@ancu/floorplan-engine` — crawl/convert/publish
- `@ancu/shared` — tokens, FloorPlanDocument, geometry, trust, furniture fit, spatial metrics

## Validation (last green)

```bash
pnpm typecheck
pnpm test          # shared 18 · engine 32 · web 36
pnpm build
pnpm lint
```

## Needs your Cloudflare account (cannot finish without secrets)

1. Create D1 / R2 / Queues; replace placeholder IDs in wrangler configs
2. Apply migration `0003_hierarchy_floorplan_trust.sql` on property D1
3. GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
4. `wrangler secret put ENGINE_API_SECRET` for the engine
5. Optional repo vars for smoke: `WEB_BASE_URL`, `ENGINE_BASE_URL`
6. Run Actions → **deploy** workflow (manual dispatch)

## Optional user-facing upgrades (suggestions only)

- Official CĐT floor-plan URLs → richer crawl → project-specific verified FloorPlanDocuments
- Real amenity POI feed (OpenStreetMap Overpass) for denser map detail
- Travel-time via a licensed routing API (never invent times)
- Admin review UI for uncertain openings/walls
