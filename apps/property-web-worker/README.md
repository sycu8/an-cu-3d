# @ancu/property-web-worker

Public React + Cloudflare Workers property showroom for AnCư 3D.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Vite dev server with Worker |
| `pnpm build` | Typecheck + production build |
| `pnpm typecheck` | TypeScript project references |
| `pnpm test` | Vitest unit tests |
| `pnpm deploy` | Deploy to Cloudflare (requires wrangler auth) |

## Local setup

```bash
cp .dev.vars.example .dev.vars
pnpm install   # from repo root
pnpm --filter @ancu/property-web-worker dev
```



> Local `pnpm dev` uses `remoteBindings: false` so D1/R2 run locally without a Cloudflare API token. Live Workers AI / remote bindings need a token and are out of scope for the sanitized local QA pass.

## Local production-like data

```bash
cp .dev.vars.example .dev.vars
pnpm db:migrate:local
pnpm db:seed:local   # sanitized D1-only demo project (no real prices)
pnpm --filter @ancu/property-web-worker dev
```

Seed inventory includes Gamuda Land, Vinhomes, Ecopark, and Đất Xanh/Bluemarq projects with documents + handover metadata. Do not invent prices/areas/handover dates — use `Chờ xác minh` until verified. Never apply `scripts/seed-local-demo.sql` to remote/production without explicit approval.

## Build

```bash
pnpm --filter @ancu/property-web-worker build
```

Output: `dist/` (SPA assets) + Worker bundle via `@cloudflare/vite-plugin`.

## Routes

- `/` — Home hero
- `/projects` — Project listing
- `/projects/:slug` — Project detail
- `/projects/:slug/3d` — Site 3D placeholders
- `/projects/:slug/apartments` — Unit types
- `/projects/:slug/apartments/:unit` — Floor plan viewer + QA
- `/projects/:slug/showroom` — Showroom lighting/materials/hotspots
- `/map` — MapLibre HCMC map
- `/compare` — Side-by-side comparison (up to 3)
- `/blog`, `/blog/:slug` — Public blog
- `/admin` — Admin build + blog draft (Bearer secret)

## API

- `GET /api/health`
- `GET /api/projects`
- `GET /api/projects/:slug`

## Migrations

```bash
wrangler d1 migrations apply ancu-property-db --local
```
