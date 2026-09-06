# QA findings log

## Protocol

- Log every bug with: ID, severity, surface, steps, expected, actual, evidence, status.
- Prefer shared-cause fixes + regression tests.
- No production deploy / real secrets / destructive cloud actions without ask.

## Bugs

### BUG-001 — Public SPA ignored `/api/projects` (admin/D1 invisible)

- **Severity:** High
- **Surface:** Home, Projects, Detail, Map, Compare, Apartments, Viewer, 3D, Showroom
- **Steps:** Publish project in D1; open `/projects/{slug}` as visitor
- **Expected:** Public routes resolve D1+seed merge
- **Actual:** Seed-only lookup → 404 for D1-only slugs
- **Evidence:** Routes imported seed helpers directly
- **Status:** Fixed — `useProject(s)` hooks + worker merge; regressions in `app.test.ts` / `worker/index.test.ts`
- **Shared cause:** Dual data path (seed vs API) without client fetch

### BUG-002 — Showroom missing from project detail / 3D CTAs

- **Severity:** Medium
- **Surface:** Project detail, Project 3D
- **Steps:** Open project detail; look for showroom
- **Expected:** CTA to `/projects/:slug/showroom`
- **Actual:** Only 3D / apartments / map / compare
- **Status:** Fixed — Showroom CTA on detail + 3D

### BUG-003 — Demo inventory too thin for map/compare density

- **Severity:** Low
- **Surface:** Map, Compare, Projects list
- **Steps:** Local QA with only 3 Gamuda stubs
- **Expected:** Production-like sanitized density without real PII/prices
- **Actual:** Sparse markers / compare options
- **Status:** Fixed — `demo-scale-projects.ts` (+ local D1 seed script)

### BUG-004 — LoadState `.data` accessed while `loading` (type/runtime risk)

- **Severity:** Medium
- **Surface:** Home, Compare, Map
- **Steps:** Typecheck / first paint before fetch settles
- **Expected:** Safe empty arrays until ready
- **Actual:** Direct `state.data` on union without narrowing
- **Status:** Fixed — `"data" in state` guards


### BUG-005 — Worker returned 404 for all SPA client routes

- **Severity:** High
- **Surface:** Every non-API page except `/` (projects, map, compare, admin, blog, detail, …)
- **Steps:** Open `http://localhost:5173/projects` (Vite + Cloudflare plugin)
- **Expected:** SPA `index.html` for client router
- **Actual:** Plain-text `Not Found` 404 from Worker fetch handler
- **Evidence:** curl `/projects` → `text/plain` body `Not Found`; `/` HTML 200
- **Status:** Fixed — `assets.run_worker_first: ["/api/*"]` in `wrangler.jsonc`; Worker prefers Static Assets `fetch` when available
- **Shared cause:** Worker handled all methods/paths and short-circuited asset/SPA pipeline

## Known limitations (not bugs / deferred)

| ID | Note |
| --- | --- |
| LIM-001 | Blog body often raw markdown (no full MD renderer) |
| LIM-002 | Map travel time always pending (no routing engine) |
| LIM-003 | Project 3D is schematic blocks, not BIM |
| LIM-004 | Nearby POIs for D1-only projects need D1 nearby rows (map still uses seed nearby) |
| LIM-005 | `POST /api/admin/assist/2d3d` is API-only (no admin UI control yet) |
| LIM-006 | Live AI crawl/blog requires AI Gateway secrets (local optional) |

## Pass status

- Inventory: `docs/qa-inventory.md`
- Automated regressions: `pnpm test` (seed density + `/api/projects` merge)
- Manual browser pass: pending this turn after local server start
