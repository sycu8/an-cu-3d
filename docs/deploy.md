# Deploy notes (P29)

## Secrets (GitHub)

Required repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Required before either deploy workflow runs `scripts/cf-deploy.sh`:

- `ENGINE_API_SECRET` — one value, set as a GitHub secret. It must be at least 32 characters of printable ASCII (no spaces, tabs, CR, LF, or other characters). The script exits if it is missing, too short, or not printable ASCII. It does not trim or generate a replacement. After both Workers deploy, it runs `wrangler secret put ENGINE_API_SECRET` in `apps/property-web-worker` and `apps/ancu-floorplan-engine` with that same value.

`ENGINE_BASE_URL` is not a secret. A deploy without `--env` and `--env production` use `https://ancu-floorplan-engine.sycu-lee.workers.dev`. `env.preview` does not set `ENGINE_BASE_URL`: the preview engine Worker does not exist, and wrangler does not inherit top-level vars, so a preview build skips the engine crawl and `/jobs` calls instead of targeting a missing host. `keep_vars` is false so a dashboard value cannot drop the var on the environments that do set it.

Optional later:

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

Admin UI uses **username/password** stored in D1 (`admin_users` / `admin_sessions`). Login checks that stored hash only. It does not create a default account, and a failed login does not rewrite `password_hash`.

Create the first operator only when `admin_users` is empty:

1. **One-time token** — set `ADMIN_BOOTSTRAP_TOKEN` to at least 32 characters (shorter values disable bootstrap), then `POST /api/admin/bootstrap` with JSON `{"token","username","password"}`. A later call returns `admin_exists`. Unset the token after setup.
2. **Initial hash** — set `ADMIN_BOOTSTRAP_USERNAME` and `ADMIN_INITIAL_PASSWORD_HASH`. The hash is a `pbkdf2-sha256$iterations$salt$hash` string (PBKDF2-SHA256 at 100000 iterations, the Workers maximum). A higher iteration count is rejected and does not log in. It is not a plaintext password. The first login for that username inserts the row and sets `must_change_password`. An existing row is left unchanged.

If an admin row already exists, these secrets do not rotate it. Change that password in `/admin`, then delete rows from `admin_sessions`.

```bash
pnpm --filter @ancu/property-web-worker exec wrangler secret put ADMIN_BOOTSTRAP_TOKEN
# Alternative when bootstrapping from a precomputed hash:
# pnpm --filter @ancu/property-web-worker exec wrangler secret put ADMIN_BOOTSTRAP_USERNAME
# pnpm --filter @ancu/property-web-worker exec wrangler secret put ADMIN_INITIAL_PASSWORD_HASH
```

No `ADMIN_SECRET` Worker secret is required for admin UI auth.

```bash
# Optional AI Gateway (research / blog / image / QA). Without these, pipelines use deterministic fallbacks.
pnpm --filter @ancu/property-web-worker exec wrangler secret put AI_GATEWAY_TOKEN
pnpm --filter @ancu/property-web-worker exec wrangler secret put AI_GATEWAY_ACCOUNT_ID
pnpm --filter @ancu/property-web-worker exec wrangler secret put AI_GATEWAY_ID
```

Apply D1 migrations (includes `0004_admin_auth.sql`) before using `/admin`.

`scripts/cf-deploy.sh` writes the same `ENGINE_API_SECRET` onto both Workers. The property Worker reads `ENGINE_BASE_URL` from wrangler vars. A missing URL or secret is logged as a warning and the engine calls are skipped (this is the preview path, which has no `ENGINE_BASE_URL`). A non-2xx engine response (including 401 and 5xx) fails the build job. A failed crawl or `/jobs` call saves a `failed` placeholder only when that slug is new. Rebuilding an existing project records the failure on the build job and leaves the published row and its amenities, apartment types, nearby places, and sources unchanged. Public `GET /api/projects` and `GET /api/projects/:slug` return `published` rows only; any other status is omitted or 404.

### Smoke (admin + blog)

```bash
# Health + blog + admin gate
WEB_BASE_URL=https://ancu-property-web.example.com \
ENGINE_BASE_URL=https://ancu-floorplan-engine.example.com \
node scripts/smoke.mjs

# Optional authenticated admin check — use the rotated operator.
ADMIN_USER='<operator>' ADMIN_PASSWORD='<password>' \
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
