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


### BUG-006 — 3BR units reused 2BR sample floorplan keys

- **Severity:** High (trust)
- **Surface:** Apartment viewer, showroom, Grand Park / Vinhomes / Ecopark / Đất Xanh seeds
- **Steps:** Open 3 PN unit on Vinhomes Grand Park
- **Expected:** No verified/factual 2BR layout presented as 3BR
- **Actual:** `floorplanKey: "2br-c"` → Celadon 2BR sample
- **Status:** Fixed — remove 3BR keys; `resolveFloorPlanForUnit` rejects bedroom mismatch; `floorplanVerification` labels; public API strips unknown keys
- **Regression:** `public-project.test.ts`, `app.test.ts`, shared `trust.test.ts`

### BUG-007 — Public API dropped all estimated apartment typologies

- **Severity:** Medium
- **Surface:** Project detail apartments section via `/api/projects/:slug`
- **Steps:** Load Grand Park from API
- **Expected:** Typology cards with trust labels (even without verified area/price)
- **Actual:** Empty `apartmentTypes` after buyer gate
- **Status:** Fixed — keep typologies; strip pending facts; attach `floorplanVerification`

## Known limitations (not bugs / deferred)

| ID | Note |
| --- | --- |
| LIM-001 | Blog body often raw markdown (no full MD renderer) |
| LIM-002 | Map/Compare commute shows distance-only via shared `getRoute` until a licensed routing provider is configured — never fabricates travel time |
| LIM-003 | Project 3D is schematic blocks, not BIM |
| LIM-004 | Nearby POIs for D1-only projects need D1 nearby rows (map still uses seed nearby) |
| LIM-005 | `POST /api/admin/assist/2d3d` is API-only (no admin UI control yet) |
| LIM-006 | Live AI crawl/blog requires AI Gateway secrets (local optional) |
| LIM-007 | Seed floorplans remain illustrative cross-project samples until published FloorPlanDocuments exist |
| LIM-008 | Engine vision/extract still stubbed — conversion needs `seedDocument` or human review |
| LIM-009 | Documents/handover still seed-only (not yet loaded from D1) |
| LIM-010 | Space score suppressed for illustrative/estimated layouts (by design) |

## Pass status

- Inventory: `docs/qa-inventory.md`
- Automated regressions: `pnpm test` (shared 18 · engine 32 · web 36)
- Manual browser pass: pending after deploy preview
