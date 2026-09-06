# `@ancu/floorplan-engine`

Internal conversion service: allowlisted crawl → ingest → analyze → FloorPlanDocument → review/publish.

## Commands

```bash
pnpm dev          # wrangler dev (set .dev.vars from .dev.vars.example)
pnpm build        # wrangler deploy --dry-run
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest
```

Bindings: `ENGINE_DB`, `FLOORPLANS`, `CONVERSION_QUEUE`, `CRAWL_QUEUE`, `CONVERSION_WORKFLOW`, `AI`, `BROWSER`.

All routes except `GET /health` require `Authorization: Bearer $ENGINE_API_SECRET`.
