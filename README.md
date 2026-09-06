# AnCư 3D

**Hiểu căn nhà trước khi gọi là nhà.**  
**Explore. Compare. Decide.**

[![CI](https://github.com/sycu8/an-cu-3d/actions/workflows/ci.yml/badge.svg)](https://github.com/sycu8/an-cu-3d/actions/workflows/ci.yml)

AnCư 3D is a **trust-first property decision platform** — not another listing site.

It helps people understand a home *before* they call it home: floor plans you can trust (or clearly distrust), space you can walk in 3D, location you can reason about, and comparisons driven by *your* priorities — never by invented facts.

Reference experience: **Vinhomes Grand Park** (and related HCMC master-planned projects), on the **Cloudflare Developer Platform** (Workers · D1 · R2 · Queues / Workflows).

---

## Why this exists

Buying a home in Vietnam is high-stakes and low-clarity:

- Marketing sites show pretty renders and hide uncertainty.
- Listing portals dump price/area without provenance.
- “3D tours” often look complete while geometry is wrong or mismatched.
- Commute times and fit scores get fabricated to feel finished.

AnCư’s bet is the opposite:

> **Accuracy beats fake completeness.**  
> Unknown is better than wrong. Labels beat silence. Deterministic geometry beats generative “pretty wrong” 3D.

We are building a place where a visitor can:

1. **Explore** a project and unit honestly (2D / 3D / interior try-on).
2. **Compare** projects and unit types against their own weights.
3. **Decide** with a clear trail of what is verified, estimated, illustrative, or still unknown.

---

## Product thesis (chi tiết ý đồ)

### Positioning

| Vietnamese | English |
| --- | --- |
| *Hiểu căn nhà trước khi gọi là nhà.* | Understand the home before you call it home. |
| Khám phá · So sánh · Quyết định | Explore · Compare · Decide |

AnCư is a **decision surface**, not an inventory feed.

- Primary user: someone seriously evaluating a primary residence (often family / couple / WFH needs).
- Primary job: *“Căn này có hợp với tôi không — và tôi tin dữ liệu này đến đâu?”*
- Non-goal: ranking every listing in Vietnam, chatty sales bots, or LLM-invented travel times.

### Design principles

1. **Trust is a first-class UX.** Every floor plan, price, and measurement carries a verification state visitors can read in Vietnamese.
2. **Never launder bad geometry.** A 2BR sample must never silently appear as a 3BR “fact.”
3. **Unknown ≠ content.** Do not dress “Chờ xác minh” as if it were a verified value.
4. **Deterministic over generative for scores.** Fit, furniture clearance, space score, and ranking are rule-based. No LLM writes verdicts.
5. **Travel time only when a real router exists.** Until then: straight-line / distance-only, labeled honestly.
6. **FloorPlanDocument JSON is the source of truth.** GLB / dollhouse meshes are derived views — not the canonical apartment model.
7. **Additive infrastructure.** D1 migrations expand; they do not destroy. Secrets stay out of git.

### What “good” feels like on Grand Park

Open a project → read the brand and one clear promise → pick a unit → see whether the floor plan is verified or illustrative → walk 2D/3D → ask “Căn này có hợp với bạn?” with your household prefs → check location without fake ETAs → compare against other projects with *your* weights → see sources.

If the first screen could belong to any other portal after removing the nav, branding failed. If a mismatched floor plan renders as truth, trust failed.

---

## What you can do today

### For visitors

- Browse projects with provenance-aware facts (pending prices/areas stripped from “buyer fact” surfaces).
- Project detail IA (Grand Park reference): Hero → quick facts → explore → choose unit → space modes → fit → location → compare → sources.
- Unit viewers: 2D plan, procedural 3D dollhouse, interior try-on modes with `?unit=` URL state.
- **Trust badges** for floorplan verification: verified / partially verified / estimated / illustrative / unknown.
- **Fit panel** — “Căn này có hợp với bạn?” from session lifestyle preferences (no account).
- **Compare** up to three projects with weighted ranking (budget, space, commute, schools, amenities); missing metrics are skipped, not invented.
- **Map** with amenity filters and durable `?destination=` — distance via shared routing abstraction; no fabricated duration.

### For operators (admin)

- Bearer-auth `/admin` (`ADMIN_SECRET`) to drive crawl / synthesize / publish flows.
- Blog drafts and AI-assisted tooling behind gateway bindings (optional; deterministic fallbacks when unset).

### For the conversion pipeline (engine)

- Allowlisted crawl → convert → validate → review → publish FloorPlanDocuments to R2.
- Shared schema + topology checks; legacy documents force human review.
- Vision / extract stages may still be stubbed — honesty over pretend automation.

---

## Trust model (visitor-facing)

| Status | Meaning |
| --- | --- |
| `verified` | Floor plan geometry accepted as factual for this typology |
| `partially_verified` | Some objects/scale trusted; treat precise claims carefully |
| `estimated` | Modelled / approximate — show as ước lượng |
| `illustrative` | Sample / marketing geometry — **not** an official plan |
| `unknown` | No safe geometry to show |

Hard rules enforced in shared + public API + viewers:

- Bedroom mismatch → refuse to render as fact.
- Seed samples default to illustrative / estimated, never verified.
- Precise measurements require sufficient scale confidence and non-estimated scale.
- Space score / furniture fit suppress themselves when geometry is insufficient.

---

## Architecture (high level)

```text
Browser
  │
  ▼
property-web-worker          ← public UI + API (Workers + Assets)
  ├── D1   DB                projects, units, media meta, trust columns
  ├── R2   ASSETS            media + published floorplan pointers
  ├── Images                 edge resize
  └── optional ENGINE bind   admin-only

ancu-floorplan-engine        ← internal conversion (no public product UI)
  ├── D1   ENGINE_DB         jobs, sources, review state
  ├── R2   FLOORPLANS        raw → published FloorPlanDocument JSON
  ├── Queues / Workflows     durable conversion
  └── Workers AI / Browser   allowlisted capture + vision cascade (stubs OK)
```

| Path | Package | Role |
| --- | --- | --- |
| `apps/property-web-worker` | `@ancu/property-web-worker` | Showroom UI + public/admin API |
| `apps/ancu-floorplan-engine` | `@ancu/floorplan-engine` | Crawl → convert → publish |
| `packages/shared` | `@ancu/shared` | Brand tokens, FloorPlanDocument, geometry, trust, furniture fit, spatial metrics, **decision + routing** |

Canonical apartment data = **FloorPlanDocument JSON**. Derived 3D is a view.

Deeper detail: [`docs/architecture.md`](docs/architecture.md).

---

## Decision intelligence (P2)

Shared, deterministic modules in `@ancu/shared`:

- **Lifestyle preferences** — household, WFH, vehicle, criterion weights (session storage in the web app).
- **Unit fit** — bedroom match + furniture clearance when geometry is verified; honest “insufficient data” otherwise.
- **Project ranking** — relative scores across a compare cohort; commute uses distance only unless a real routing provider is configured.
- **Routing abstraction** — `DistanceOnlyRoutingProvider` / `getRoute`; UI must not hardwire a vendor or invent ETAs.

These powers Compare, Map destination sync, and the fit panels on project / apartment pages.

---

## Monorepo setup

**Requirements:** Node ≥ 22, `pnpm` (see `packageManager` in root `package.json`).

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Local web / engine (after Cloudflare bindings / `.dev.vars`):

```bash
pnpm dev:web
pnpm dev:engine
```

Generate a local admin secret (writes gitignored `.dev.vars`):

```bash
node scripts/generate-admin-secret.mjs
```

Production secret (never commit):

```bash
openssl rand -base64 32
pnpm --filter @ancu/property-web-worker exec wrangler secret put ADMIN_SECRET
```

Deploy notes and Cloudflare resource checklist: [`docs/deploy.md`](docs/deploy.md).

---

## Product routes (web)

```text
/                              home
/projects                      catalog
/projects/:slug                Grand Park–style decision IA
/projects/:slug/apartments/:unit   2D / 3D / auto  (?view=)
/projects/:slug/showroom       interior try-on
/map                           connectivity  (?project=&destination=)
/compare                       weighted compare  (?a=&b=&c=&unit=)
/admin                         operator console (Bearer ADMIN_SECRET)
/blog                          editorial (drafts from cron; no auto-publish)
```

URL state is part of the product: `unit`, `view`, `destination`, compare slots, etc.

---

## Roadmap snapshot

MVP spine (showroom + conversion + procedural 3D + map/compare) is in place. Active wave: **property decision platform**.

**Done in this wave:** trust semantics, Grand Park UX, floorplan fidelity guards, furniture/spatial helpers, commute + weighted decide + guided fit.

**Still deferred (on purpose):** daylight/view sims (need orientation), real vision extract replacing seeds, admin floorplan review overlay UI, production secrets + deploy smoke on your Cloudflare account.

Full checklist: [`docs/roadmap.md`](docs/roadmap.md) · agent notes: [`docs/agent-state.md`](docs/agent-state.md) · QA log: [`docs/qa-findings.md`](docs/qa-findings.md).

---

## What this repo is not

- Not a generic MLS / classifieds scraper.
- Not a chatbot that “recommends” homes without verifiable inputs.
- Not a promise of live travel times without a licensed routing provider.
- Not a claim that seed floor plans are CĐT-verified — they are labeled illustrative until published documents exist.

---

## Contributing / agent policy

- Prefer shared-cause fixes + regression tests when trust bugs appear.
- Additive D1 only; no destructive migrations without explicit confirmation.
- Do not invent buyer facts to make demos look complete.
- Secrets and account IDs stay in Wrangler / GitHub Actions — never in source.

---

## License / status

Private product workspace. Cloudflare resource IDs and production secrets are environment-specific; placeholders in Wrangler configs must be replaced before real deploy.

---

*AnCư 3D — Hiểu căn nhà trước khi gọi là nhà.*
