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
- [ ] P2 Brand/design system
- [ ] P3 Cloudflare bindings/config
- [ ] P4 D1 migrations
- [ ] P5 R2 conventions
- [ ] P6 Main app shell/routes
- [ ] P7 Gamuda data/source registry
- [ ] P8 Source crawler
- [ ] P9 Asset classification/dedupe
- [ ] P10 Conversion job engine
- [ ] P11 Image normalization
- [ ] P12 Vision extraction (cascade stubs + cache contract)
- [ ] P13 FloorPlanDocument
- [ ] P14 Scale calibration
- [ ] P15 Wall topology
- [ ] P16 Doors/windows
- [ ] P17 Rooms
- [ ] P18 Geometry validation
- [ ] P19 Procedural 3D engine
- [ ] P20 Furniture
- [ ] P21 Dollhouse/apartment UI
- [ ] P22 QA overlay
- [ ] P23 Review/publish flow
- [ ] P24 Project 3D experience
- [ ] P25 Map/location
- [ ] P26 Comparison/infographics
- [ ] P27 Mobile/performance
- [ ] P28 Security/observability
- [ ] P29 Production validation

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
