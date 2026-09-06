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
- `/map` — MapLibre HCMC map
- `/compare` — Side-by-side comparison (up to 3)

## API

- `GET /api/health`
- `GET /api/projects`
- `GET /api/projects/:slug`

## Migrations

```bash
wrangler d1 migrations apply ancu-property-db --local
```
