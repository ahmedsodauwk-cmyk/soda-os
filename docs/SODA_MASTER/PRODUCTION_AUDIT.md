# SODA OS — Production Audit Report

**Sprint:** 18 — Production Certification  
**Date:** 2026-07-11  
**Repo:** `C:\Users\ahmed\soda-os`  
**Git baseline:** `b3b56fd` Sprint 23 - Finance ledger on Supabase (plus prior Supabase migration sprints 15–22)

---

## Executive verdict

| Metric | Value |
|--------|-------|
| **Production Readiness** | **78%** |
| **Overall status** | **PARTIAL** — core ops modules on Supabase; calendar UI, files repo, monthly closing, and several stubs remain |

Empty database is acceptable. Certification is about wiring, not seeded demo content.

---

## Quality gates (evidence)

| Gate | Result | Evidence |
|------|--------|----------|
| `npm run lint` | **PASS** | eslint exit 0 |
| `npm run typecheck` / `tsc --noEmit` | **PASS** | exit 0 |
| `npm run build` | **PASS** | Next.js 16.2.10 compiled; routes generated |
| Supabase health | **PASS** | `scripts/check-supabase.ts` — configured, tables present, R/W smoke PASS |
| Modules CRUD smoke | **PASS** | `scripts/smoke-modules-crud.ts` — taxonomy, equipment, project, order, payment, invoice, quotation |
| Finance smoke | **PASS** | `scripts/smoke-finance.ts` — event + allocation create/cleanup |
| Browser console | **NOT FULLY TESTED** | No interactive browser pass this sprint; client hubs use `.catch(console.error)` on refresh failures |

---

## Checklist 1–20

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | No mock repositories as source of truth | **PARTIAL** | Most `lib/*/repository.ts` hit Supabase. **Exceptions:** `lib/files/repository.ts` (in-memory `mockFiles`); `lib/taxonomy/repository.ts` (reads local seed; upserts via `persist.ts`); `lib/payroll/repository.ts` / `lib/reports/repository.ts` stubs |
| 2 | No fake / demo business data | **PASS** | Domain `mock-*.ts` / `seed.ts` arrays are **empty**. Taxonomy seed is structural reference (workspaces/lanes), not demo clients. `PROJECT_JOURNEY_STAGES` empty |
| 3 | No demo components | **PASS** | No `Demo*` components under `components/` |
| 4 | Every module uses Supabase | **PARTIAL** | Core domains yes (via `refreshAllDomainData`). Files table exists in schema but repo unused. Taxonomy reads are seed-first |
| 5 | CRUD paths | **PASS** (core) | Clients, people/crew, projects, orders, assignments, quotations (C/U), payments, invoices, equipment, finance events — create/update/delete (or append-only) present; smoke PASS |
| 6 | Pages / routes | **PARTIAL** | App routes for dashboard, quotations, orders, commercial, clients, crew, finance, projects. **Calendar** and **Settings** sidebar → `#`. No `/equipment` inventory page |
| 7 | Search | **PARTIAL** | Header search + module filters exist; header reads sync caches (may be empty until a refresh path runs) |
| 8 | Dashboard | **PARTIAL** | `loadDashboardSnapshot` → Supabase refresh. Uses frozen `BUSINESS_TODAY` / `DASHBOARD_AS_OF` = `2026-07-10` |
| 9 | Finance | **PARTIAL** | Ledger on Supabase; wallet UI shell. `getFinanceSummary` pending/outstanding hardcoded `0`; `getInvoices()` in finance repo returns `[]` |
| 10 | Crew payments | **READY** | `lib/integration/flows.ts` crew_payment emits; crew profile payment summaries from people repo |
| 11 | Monthly closing | **BLOCKED** | No `closeMonth` / period-close API or UI found |
| 12 | Orders | **READY** | Supabase CRUD + hub UI + smoke |
| 13 | Quotations | **READY** | Supabase + pipeline UI; no dedicated `deleteQuotation` (soft lifecycle via stages) |
| 14 | Equipment | **PARTIAL** | Supabase CRUD + smoke; UI only on crew assign/history — no inventory route |
| 15 | Calendar | **BLOCKED** (product surface) | Derived repo from projects/orders OK; **no page**; nav `#`; quick action “soon” |
| 16 | Broken imports | **PASS** | typecheck + build |
| 17 | Lint | **PASS** | |
| 18 | Typecheck | **PASS** | |
| 19 | Build | **PASS** | |
| 20 | Console / client throws | **PARTIAL** | Repo throws on Supabase errors (expected). No browser certification this run |

---

## Module scores

| Module | Score | Mark | Notes |
|--------|------:|------|-------|
| Clients | 95 | **READY** | Supabase CRUD; hubs refresh on mount; segment pages `force-dynamic` |
| Crew / People | 92 | **READY** | Supabase; work history derived; payments/performance wired |
| Orders | 90 | **READY** | Supabase CRUD + smoke |
| Projects | 90 | **READY** | Supabase; enrichment from orders/payments |
| Quotations | 88 | **READY** | Supabase + convert pipeline; no hard delete |
| Payments | 90 | **READY** | Supabase CRUD |
| Invoices / Deliveries | 88 | **READY** | Supabase; finance barrel `getInvoices` still stub |
| Assignments | 90 | **READY** | Supabase; crew pay updates |
| Equipment | 80 | **PARTIAL** | Backend READY; no inventory page |
| Finance / Ledger | 82 | **PARTIAL** | Supabase append-only ledger + smoke; UI shell only; no monthly close |
| Dashboard | 82 | **PARTIAL** | Live aggregations; frozen studio clock |
| Commercial / Workspaces | 88 | **READY** | Taxonomy + project/order rollups |
| Taxonomy | 75 | **PARTIAL** | Seed reads + Supabase upsert for FKs |
| Calendar | 35 | **BLOCKED** | Derived data only; no route/UI |
| Files / Assets | 20 | **BLOCKED** | `public.files` table exists; repository still mock-empty; types say “mock-only” |
| Search (global) | 78 | **PARTIAL** | Works when caches warm |
| Payroll | 10 | **BLOCKED** | Explicit stub |
| Reports | 15 | **BLOCKED** | Definitions only; `buildEmptyReport` |
| Monthly closing | 0 | **BLOCKED** | Not implemented |
| Auth / Login | 40 | **PARTIAL** | `/login` route present; not audited as full auth gate |

**Weighted readiness (ops-critical modules):** ~**78%**  
(Payroll/Reports treated as out-of-scope stubs; Calendar/Files/Monthly closing pull the score down.)

---

## Critical issues

1. **Files module not on Supabase** — migration creates `public.files`; `lib/files/repository.ts` still reads `mockFiles` only.
2. **Calendar product surface missing** — sidebar and quick actions point to `#`; no `app/calendar` page despite derived repository.
3. **Monthly closing absent** — no period-close workflow for production finance ops.
4. **Frozen business clock** — `BUSINESS_TODAY` / `DASHBOARD_AS_OF` hardcoded to `2026-07-10` skews upcoming/overdue/schedule math vs real “today”.

### Fixed during this audit (critical)

- **Finance page never refreshed ledger** — now `await refreshFinance()` + `dynamic = "force-dynamic"`.
- **Dashboard & Crew statically prerendered** — added `dynamic = "force-dynamic"` so request-time Supabase data is served (avoids empty/stale static HTML after mutations).

---

## Warnings

- `lib/supabase/env.ts` comment still says domain repos are in-memory (stale docs).
- Legacy empty `mock-data.ts` / `seed.ts` files remain (harmless if unused as SoT).
- `crew/repository.ts` re-exports `mockPeople as mockCrew` (empty alias).
- Finance UI explicitly “shell”; summary pending/outstanding not computed.
- Header search may miss hits until domain caches are refreshed.
- Settings nav is `#`.
- Browser console / E2E not certified this sprint.
- `SUPABASE_SERVICE_ROLE_KEY` optional/missing (OK for anon-path smoke).

---

## Recommended fixes (to reach ~100%)

| Priority | Fix | Est. |
|----------|-----|------|
| P0 | Wire `lib/files` to Supabase `files` table (or remove table/UI claims) | 0.5–1 d |
| P0 | Replace `BUSINESS_TODAY` with real local/UTC date (keep override for tests) | 0.5 d |
| P1 | Calendar page + nav using `getCalendarEvents()` | 1–2 d |
| P1 | Monthly closing (period snapshot + lock or report) | 2–3 d |
| P2 | Equipment inventory route/CRUD UI | 1 d |
| P2 | Finance summary: pending + outstanding from payments/invoices | 1 d |
| P3 | Payroll / Reports: ship or hide from product claims | 2–5 d |
| P3 | Taxonomy read-from-Supabase (optional; seed+upsert OK for v1) | 0.5 d |
| P3 | Warm global search caches / server search API | 0.5 d |
| — | Full browser smoke (login, CRUD, console clean) | 0.5–1 d |

**Estimated time to 100% (honest):** **6–10 engineer-days** if Calendar + Files + monthly closing + live clock + finance summary are required for “certified.”  
**To ~90% (ship core studio ops):** **2–3 days** (clock + files + calendar nav/page + force-dynamic audit of remaining server pages).

---

## Repository backend matrix

| Repository | Backend | Cache |
|------------|---------|-------|
| clients, people, projects, orders, assignments, quotations, payments, invoices, equipment, finance | **Supabase** | in-memory cache after refresh |
| dashboard, workspaces, crew (alias), calendar | **Derived** from Supabase-backed domains | — |
| taxonomy | **Seed read** + Supabase upsert | — |
| files | **Mock array** | — |
| payroll, reports | **Stub** | — |

---

## Sign-off

| Role | Result |
|------|--------|
| Lint / types / build | Certified PASS |
| Supabase connectivity | Certified PASS |
| Core CRUD smoke | Certified PASS |
| Full production certification | **NOT GRANTED** — PARTIAL at **78%** |

*Audit performed without feature development except critical load/prerender fixes noted above.*
