# AnCư 3D (`ancu-3d`)

**Hiểu căn nhà trước khi gọi là nhà.**

Trusted digital property showroom + architectural explorer + location intelligence for Gamuda Land projects in HCMC — on the Cloudflare Developer Platform.

## Workspace

| Path | Package | Role |
| --- | --- | --- |
| `apps/property-web-worker` | `@ancu/property-web-worker` | Public UI + API |
| `apps/ancu-floorplan-engine` | `@ancu/floorplan-engine` | Floor-plan conversion |
| `packages/shared` | `@ancu/shared` | Tokens, schemas, types |

See `docs/architecture.md` and `docs/agent-state.md`.

## Setup

```bash
pnpm install
```

App `dev`/`build` scripts are wired in later phases.
