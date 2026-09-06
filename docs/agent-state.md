# Agent state — AnCư 3D

## Current phase

**M4 complete** — P0–P29 landed (mobile/perf, security/observability, production validation).

Branch: `cursor/mvp-build-4bd7` · PR: https://github.com/sycu8/an-cu-3d/pull/2

## Roadmap

See `docs/roadmap.md`.

## Packages

- `@ancu/property-web-worker` — showroom UI + Workers API
- `@ancu/floorplan-engine` — crawl/convert/publish
- `@ancu/shared` — tokens, FloorPlanDocument, geometry, R2 paths

## Bindings

**web:** `DB`, `ASSETS`, optional `ENGINE`  
**engine:** `ENGINE_DB`, `FLOORPLANS`, `CONVERSION_QUEUE`, `CRAWL_QUEUE`, `CONVERSION_WORKFLOW`, `AI`, `BROWSER`

## Validation

```bash
pnpm install
pnpm --filter @ancu/shared typecheck && pnpm --filter @ancu/shared test
pnpm --filter @ancu/floorplan-engine typecheck && pnpm --filter @ancu/floorplan-engine test
pnpm --filter @ancu/property-web-worker typecheck && pnpm --filter @ancu/property-web-worker test && pnpm --filter @ancu/property-web-worker build
WEB_BASE_URL=… ENGINE_BASE_URL=… node scripts/smoke.mjs
```

## Remaining (needs your Cloudflare account)

- Create real D1/R2/Queue IDs and replace wrangler placeholders
- Set GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- Set engine secret: `wrangler secret put ENGINE_API_SECRET`
- Optional: official Gamuda floor-plan URL inventory for crawl allowlist

## Model routing

T1 default; T3 only for hard topology/3D bugs.
