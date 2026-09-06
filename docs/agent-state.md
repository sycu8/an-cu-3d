# Agent state — AnCư 3D

## Current phase

**P1 Architecture — complete**  
Next: **P2 Brand/design system**

## Confirmed architecture

- Monorepo (`pnpm` workspaces): `apps/*`, `packages/*`
- Apps:
  - `apps/property-web-worker` → `@ancu/property-web-worker` (public UI + API)
  - `apps/ancu-floorplan-engine` → `@ancu/floorplan-engine` (conversion pipeline)
- Shared: `packages/shared` → `@ancu/shared` (tokens, Zod schema, types)
- FloorPlanDocument JSON = architectural SoT; GLB optional derived
- Config: `wrangler.jsonc` per app; envs `local` | `preview` | `production`
- See `docs/architecture.md`

## Binding names

**property-web:** `DB`, `ASSETS`, optional `ENGINE`  
**engine:** `ENGINE_DB`, `FLOORPLANS`, `CONVERSION_QUEUE`, `CRAWL_QUEUE`, `CONVERSION_WORKFLOW`, `AI`, `BROWSER`

Logical resources: `ancu-property-db`, `ancu-engine-db`, `ancu-property-assets`, `ancu-floorplans`, `ancu-conversion`, `ancu-crawl`, `ancu-conversion-workflow`

## Important paths

- `/workspace/docs/architecture.md`
- `/workspace/docs/agent-state.md`
- `/workspace/apps/property-web-worker/`
- `/workspace/apps/ancu-floorplan-engine/`
- `/workspace/packages/shared/`

## Completed decisions

- Greenfield repo; Cloudflare Workers + D1 + R2 primary
- Separate D1/R2 for product vs engine
- Queues + Workflows for crawl/conversion durability
- Workers AI cascade (cheap → stronger); cache by input hash
- MapLibre + provider abstraction; R3F procedural renderer
- Initial projects: Eaton Park, Elysian, Celadon City (no fabricated facts)
- Brand palette locked in master prompt (implement P2)

## Unresolved blockers

- Cloudflare resource IDs not created yet (P3+)
- Official Gamuda floor-plan source URLs not inventoried (P7–P8)
- No CI deploy wiring yet (secrets exist in GitHub; wiring later)

## Validation commands

```bash
pnpm install
# after P3+: wrangler types (per app)
# after code: pnpm typecheck && pnpm test
```

## Model routing default

T1 (Composer 2.5 / GPT-5.6 Luna) through P11/P13; escalate per matrix for geometry (P14–P18).
