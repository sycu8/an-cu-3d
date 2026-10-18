# Deploy notes (P29)

## Secrets (GitHub)

Required repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Optional later:

- `ENGINE_API_SECRET` (engine Worker secret)
- Preview/production D1 database IDs if not injected by `wrangler d1 create` output into env-specific config

## CI deploy workflow

`.github/workflows/ci.yml` is the only workflow that deploys on a push to `main`, and only after typecheck, tests, and build succeed. The `deploy` job runs `scripts/cf-deploy.sh` only when `github.ref` is `refs/heads/main`: on that push, or a manual **Run workflow** started from `main` with `deploy` set to true. That input defaults to false. Pull requests and other branches do not deploy; they run `wrangler deploy --dry-run` at most.

`.github/workflows/deploy.yml` is manual-only. It does not run on push. Its `deploy` job requires `github.ref == refs/heads/main` and a typed confirm of `deploy` (the field is not pre-filled), then runs `scripts/cf-deploy.sh`.

Both deploy paths use the concurrency group `cloudflare-deploy` with `cancel-in-progress: false`. A second production deploy waits; it does not cancel one that is already running.

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


## Admin auth + AI Gateway secrets (property-web)

Admin UI uses **username/password** stored in D1 (`admin_users` / `admin_sessions`). The default operator account is bootstrapped on first login and **must change password** before other admin APIs work.

No `ADMIN_SECRET` Worker secret is required for admin UI auth.

```bash
# Optional AI Gateway (research / blog / image / QA). Without these, pipelines use deterministic fallbacks.
pnpm --filter @ancu/property-web-worker exec wrangler secret put AI_GATEWAY_TOKEN
pnpm --filter @ancu/property-web-worker exec wrangler secret put AI_GATEWAY_ACCOUNT_ID
pnpm --filter @ancu/property-web-worker exec wrangler secret put AI_GATEWAY_ID
```

Apply D1 migrations (includes `0004_admin_auth.sql`) before using `/admin`.

Also set `ENGINE_API_SECRET` on both Workers when the admin build path should call the floorplan engine.

### Smoke (admin + blog)

```bash
# Health + blog + admin gate
WEB_BASE_URL=https://ancu-property-web.example.com \
ENGINE_BASE_URL=https://ancu-floorplan-engine.example.com \
node scripts/smoke.mjs

# Optional authenticated admin check
ADMIN_USER=Sycule96 ADMIN_PASSWORD='…' \
WEB_BASE_URL=https://ancu-property-web.example.com \
ENGINE_BASE_URL=https://ancu-floorplan-engine.example.com \
node scripts/smoke.mjs
```

Weekly cron (`0 1 * * 1`) only creates **draft** blog posts — never auto-publishes.

Curated posts live in `apps/property-web-worker/src/data/blog-posts.ts`. The next worker deploy serves them on `GET /api/blog`. When D1 is reachable, a missing slug is inserted as `published` (an existing row, including archived, is not overwritten).


## Media (R2 + Images)

Property media is stored in R2 (`ASSETS` → `ancu-property-assets`) and served at:

```text
GET /api/media/<r2-key>?v=card|thumb|blog|hero
GET /api/media/<r2-key>?w=800&h=600&fit=cover&f=webp&q=85
```

The Worker reads the object from R2 and, when the `IMAGES` binding is available, resizes/encodes via Cloudflare Images. Responses are Cache-API cached.

No public R2 write. Admin image generate/edit endpoints return `{ r2Key, url, note }`.
