# Deploy notes (P29)

## Secrets (GitHub)

Required repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Optional later:

- `ENGINE_API_SECRET` (engine Worker secret)
- Preview/production D1 database IDs if not injected by `wrangler d1 create` output into env-specific config

## CI deploy workflow

`.github/workflows/deploy.yml` runs on `workflow_dispatch` and pushes to `main`:

1. Install, typecheck, test, build (all packages)
2. Deploy `@ancu/property-web-worker` and `@ancu/floorplan-engine` with `environment: production`

Do not hardcode account IDs or API tokens in the repository.

## Post-deploy smoke checks

From the repo root (after deploy or against local dev servers):

```bash
# Defaults: WEB_BASE_URL=http://localhost:5173, ENGINE_BASE_URL=http://localhost:8787
node scripts/smoke.mjs

# Production example
WEB_BASE_URL=https://ancu-property-web.example.com \
ENGINE_BASE_URL=https://ancu-floorplan-engine.example.com \
node scripts/smoke.mjs
```

Exits non-zero if `/api/health` (web) or `/health` (engine) does not return `{ "status": "ok" }`.

## Create resources (once per env)

```bash
# Auth via `wrangler login` or CLOUDFLARE_API_TOKEN
pnpm dlx wrangler d1 create ancu-property-db
pnpm dlx wrangler d1 create ancu-engine-db
pnpm dlx wrangler r2 bucket create ancu-property-assets
pnpm dlx wrangler r2 bucket create ancu-floorplans
pnpm dlx wrangler queues create ancu-conversion
pnpm dlx wrangler queues create ancu-conversion-dlq
pnpm dlx wrangler queues create ancu-crawl
pnpm dlx wrangler queues create ancu-crawl-dlq
```

Replace placeholder `database_id` values in each app `wrangler.jsonc`, then:

```bash
pnpm --filter @ancu/property-web-worker exec wrangler d1 migrations apply DB --local
pnpm --filter @ancu/floorplan-engine exec wrangler d1 migrations apply ENGINE_DB --local
pnpm --filter @ancu/property-web-worker exec wrangler types
pnpm --filter @ancu/floorplan-engine exec wrangler types
```

## Rollback

- Workers: `wrangler rollback` / prior version deploy
- D1: forward-only migrations; ship compensating migration (never hand-edit prod)
- R2 published floor plans: never overwrite; publish new version key and point D1 meta at it


## Admin + AI Gateway secrets (property-web)

Set Worker secrets (production / preview) — never commit real values:

```bash
# Local .dev.vars (gitignored)
node scripts/generate-admin-secret.mjs

# Production / preview Worker secret
openssl rand -base64 32
pnpm --filter @ancu/property-web-worker exec wrangler secret put ADMIN_SECRET
# Optional AI Gateway (research / blog / image / QA). Without these, pipelines use deterministic fallbacks.
pnpm --filter @ancu/property-web-worker exec wrangler secret put AI_GATEWAY_TOKEN
pnpm --filter @ancu/property-web-worker exec wrangler secret put AI_GATEWAY_ACCOUNT_ID
pnpm --filter @ancu/property-web-worker exec wrangler secret put AI_GATEWAY_ID
```

Also set `ENGINE_API_SECRET` on both Workers when the admin build path should call the floorplan engine.

### Smoke (admin + blog)

```bash
# Health
curl -sS "$WEB_BASE_URL/api/health"

# Admin without secret → 401
curl -sS -o /dev/null -w "%{http_code}\n" "$WEB_BASE_URL/api/admin/projects"

# Admin with secret → 200
curl -sS -H "Authorization: Bearer $ADMIN_SECRET" "$WEB_BASE_URL/api/admin/projects" | head

# Blog public list
curl -sS "$WEB_BASE_URL/api/blog"
```

Weekly cron (`0 1 * * 1`) only creates **draft** blog posts — never auto-publishes.


## Media (R2 + Images)

Property media is stored in R2 (`ASSETS` → `ancu-property-assets`) and served at:

```text
GET /api/media/<r2-key>?v=card|thumb|blog|hero
GET /api/media/<r2-key>?w=800&h=600&fit=cover&f=webp&q=85
```

The Worker reads the object from R2 and, when the `IMAGES` binding is available, resizes/encodes via Cloudflare Images. Responses are Cache-API cached.

No public R2 write. Admin image generate/edit endpoints return `{ r2Key, url, note }`.
