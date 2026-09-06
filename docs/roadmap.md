# AnCư 3D — Build Roadmap

## Goal

Ship an MVP that feels like a trusted property showroom: Gamuda HCMC projects, map/connectivity, published FloorPlanDocuments, procedural dollhouse 3D, and QA — on Cloudflare Workers + D1 + R2.

## Milestone map

| Milestone | Phases | Outcome |
| --- | --- | --- |
| **M0 Foundation** | P0–P5 | Monorepo, brand tokens, Wrangler, D1, R2 conventions |
| **M1 Product shell** | P6–P7 | Routes, showroom UI, verified Gamuda registry (no fabricated facts) |
| **M2 Conversion spine** | P8–P13 | Crawler allowlist, jobs, normalize stubs, FloorPlanDocument schema |
| **M3 Geometry → 3D** | P14–P23 | Scale/walls/openings/rooms validation, procedural R3F, QA, review |
| **M4 Experience polish** | P24–P29 | Project 3D, map/routes, compare, mobile/perf, security, prod checks |

## Phase checklist

- [x] P0 Repository inspection
- [x] P1 Architecture
- [x] P2 Brand/design system
- [x] P3 Cloudflare bindings/config
- [x] P4 D1 migrations
- [x] P5 R2 conventions
- [x] P6 Main app shell/routes
- [x] P7 Gamuda data/source registry
- [x] P8 Source crawler
- [x] P9 Asset classification/dedupe
- [x] P10 Conversion job engine
- [x] P11 Image normalization
- [x] P12 Vision extraction (cascade stubs + cache contract)
- [x] P13 FloorPlanDocument
- [x] P14 Scale calibration
- [x] P15 Wall topology
- [x] P16 Doors/windows
- [x] P17 Rooms
- [x] P18 Geometry validation
- [x] P19 Procedural 3D engine (MVP R3F viewer)
- [x] P20 Furniture (toggle + seed instances)
- [x] P21 Dollhouse/apartment UI (modes + room focus)
- [x] P22 QA overlay (basic confidence/validation panel)
- [x] P23 Review/publish flow (engine approve/reject/publish stubs)
- [x] P24 Project 3D experience (placeholder site extrusion)
- [x] P25 Map/location (MapLibre + amenity filters)
- [x] P26 Comparison/infographics (up to 3 projects)
- [x] P27 Mobile/performance
- [x] P28 Security/observability
- [x] P29 Production validation

## MVP acceptance (must demo)

1. Brand tokens applied across UI / map / 3D semantics
2. ≥3 Gamuda projects listed with provenance; unknowns = `Data pending verification`
3. Map: projects + amenity categories + route UI (no fabricated times)
4. ≥3 different FloorPlanDocuments (studio/1BR/2BR+) rendering procedurally
5. Dollhouse + top view + room focus + furniture toggle
6. QA: source 2D, top view, overlay, confidence, validation
7. Engine job API + durable pipeline hooks (Queue/Workflow ready)
8. Migrations + env separation; secrets only via GitHub/CI

## Model routing (cost)

| Band | Phases | Tier |
| --- | --- | --- |
| Tokens, CRUD, routes, seeds, Wrangler | P2–P11, P13, P19–P28 | T1 |
| Visual QA / floorplan screenshots | as needed | T2 |
| Topology / hard 3D / Workflow semantics | P14–P18 design | T3 → T1 implement |
| Unresolved production blockers | P29 edge | T4 only with escalation note |

## Execution policy

- Update `docs/agent-state.md` every completed phase band
- Prefer deterministic geometry over generative “pretty wrong” 3D
- Do not hardcode benchmark apartment coordinates into the generic renderer
- Deploy IDs/tokens stay out of git (GitHub secrets)

## Current execution

Active build wave: **M0 → M4 continuous** (user requested full-feature continuation).


## Next: Admin + AI Gateway + Showroom

- [x] Admin page — project list, add-by-name, live process timing (no rate limit/timeout)
- [x] AI Gateway client (multi-model use-cases) + crawl/synthesize fallback
- [x] Blog routes + weekly draft generation
- [x] Showroom lighting / materials / room hotspots
- [ ] Wire production secrets + deploy smoke for admin/blog
