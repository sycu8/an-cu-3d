# Agent state — AnCư 3D

## Current phase

**M4 wrap-up** — P0–P26 MVP features landed; next **P27–P29** (mobile/perf, security/observability, production validation).

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
```

## Blockers

- Real Cloudflare D1/R2/Queue IDs (placeholders in wrangler)
- Official Gamuda floor-plan URL inventory for crawl allowlist
- Map/3D bundle size (code-split remaining)

## Model routing

T1 default; T3 only for hard topology/3D bugs.
