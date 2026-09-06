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

## Security model

- **Authentication:** All routes except `GET /health` require `Authorization: Bearer $ENGINE_API_SECRET`. Token comparison uses constant-time equality (`crypto.subtle.timingSafeEqual`).
- **Production config:** When `ENVIRONMENT=production`, the worker refuses non-health traffic unless `ENGINE_API_SECRET` is at least 16 characters.
- **SSRF guard:** Crawl/fetch URLs must be HTTPS, on the Gamuda allowlist, and cannot target localhost, private IPs, or cloud metadata endpoints.
- **Rate limiting:** `POST /jobs` is soft-limited to 30 requests/minute per client IP (in-memory, best-effort on Workers — resets per isolate).
- **Observability:** Each request gets an `X-Request-Id` header and structured JSON logs with duration.

### Secrets

Copy `.dev.vars.example` to `.dev.vars` for local development and set a strong secret.

For deployed Workers, store the API secret with Wrangler (never commit it):

```bash
wrangler secret put ENGINE_API_SECRET
```

Set `ENVIRONMENT=production` in your production Worker vars when deploying.
