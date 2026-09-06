# Agent state — AnCư 3D

## Current phase

**M0–M4 continuous build** (user: roadmap + all features)  
Completed: P0, P1, **P2/P5/P13/P14–P18 foundation in `@ancu/shared`**  
In flight (parallel agents): P2–P29 scaffold/MVP toward acceptance  
Next after merge of agent work: integrate, typecheck, fill gaps, update PR

## Roadmap

See `docs/roadmap.md` (milestones M0–M4, phase checklist, MVP acceptance).

## Confirmed architecture

- Monorepo (`pnpm` workspaces): `apps/*`, `packages/*`
- Apps:
  - `apps/property-web-worker` → `@ancu/property-web-worker`
  - `apps/ancu-floorplan-engine` → `@ancu/floorplan-engine`
- Shared: `packages/shared` → `@ancu/shared`
- FloorPlanDocument JSON = SoT; GLB optional
- `wrangler.jsonc`; envs `local` | `preview` | `production`
- See `docs/architecture.md`

## Binding names

**property-web:** `DB`, `ASSETS`, optional `ENGINE`  
**engine:** `ENGINE_DB`, `FLOORPLANS`, `CONVERSION_QUEUE`, `CRAWL_QUEUE`, `CONVERSION_WORKFLOW`, `AI`, `BROWSER`

Logical: `ancu-property-db`, `ancu-engine-db`, `ancu-property-assets`, `ancu-floorplans`, `ancu-conversion`, `ancu-crawl`, `ancu-conversion-workflow`

## Important paths

- `docs/roadmap.md`, `docs/architecture.md`, `docs/agent-state.md`
- `apps/property-web-worker/`, `apps/ancu-floorplan-engine/`, `packages/shared/`

## Shared package (`@ancu/shared`)

- Tokens: `src/tokens.ts`, `src/tokens.css`
- R2 paths: `src/r2-paths.ts`
- FloorPlanDocument: `src/floorplan/schema.ts`, `src/floorplan/types.ts`
- Geometry: `src/geometry/{vec2,walls,validation}.ts`
- Seed docs: `src/floorplan/samples/` (studio / 1BR / 2BR, estimated)
- Validate: `pnpm --filter @ancu/shared typecheck && pnpm --filter @ancu/shared test`

## Completed decisions

- Separate D1/R2 product vs engine; Queues+Workflows for conversion
- Workers AI cascade + R2 inference cache by input hash
- MapLibre abstracted; R3F procedural renderer; no fabricated Gamuda facts
- Brand palette locked; implement via shared tokens
- Placeholder D1 UUIDs in wrangler until CI creates real resources

## Unresolved blockers

- Real Cloudflare resource IDs (create via wrangler + GitHub secrets on deploy)
- Official Gamuda floor-plan URL inventory (allowlist crawl later)
- Parallel agent integration may need conflict resolution

## Validation commands

```bash
pnpm install
pnpm -r run typecheck
pnpm -r run test
pnpm -r run build
```

## Model routing

T1 default; T3 for hard geometry if stubs prove insufficient.
