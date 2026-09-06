# Deploy notes (P29)

## Secrets (GitHub)

Required repository secrets (already noted by product owner):

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Optional later:

- `ENGINE_API_SECRET` (engine Worker secret)
- Preview/production D1 database IDs if not injected by `wrangler d1 create` output into env-specific config

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
