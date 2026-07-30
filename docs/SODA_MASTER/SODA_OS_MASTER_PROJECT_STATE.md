# SODA OS — MASTER PROJECT STATE

**Official path (ONLY active source of truth):**  
`docs/SODA_MASTER/SODA_OS_MASTER_PROJECT_STATE.md`

| Field | Value |
|--------|--------|
| **Document version** | `1.1.3` |
| **Last updated** | `2026-07-28` |
| **Product** | SODA OS |
| **Company** | SODA VISUALS |
| **Application version** | `0.1.0` (`package.json`) |
| **Production** | https://soda-os.vercel.app |

> This file is the **single active Master Project State**. Do not create competing Master Project State files, dated copies, or versioned duplicates under `docs/`. Older project-state documents (if any) are **legacy references only** and must not supersede this path.

---

## SINGLE SOURCE OF TRUTH RULE

1. Official file path: `docs/SODA_MASTER/SODA_OS_MASTER_PROJECT_STATE.md`
2. Document **version** + **last-updated** live inside this file
3. Update **this same file** after every approved mission
4. Never create a second Master Project State file

---

## PERMANENT RELIABILITY RULE

Before major auth / identity / DB / migrations / RLS / finance / production-data changes:

1. Read this official file
2. Fresh Source Snapshot
3. Relevant DB or Storage backup
4. Execute mission
5. Verify
6. Update **this same file**
7. Commit and push
8. Never declare **SUCCESS** from `dry_validate` / anon / incomplete fallback only

---

## CURRENT MISSION

**Centered Creation Workspaces + Home V3 / Motion V3 Production Release** — merged to `main` and pushed **2026-07-28** (`2017e78`) — **PENDING FOUNDER MANUAL VERIFICATION** on authenticated creation flows (Order, Client, Quotation drawer).

**Home V3 + Motion V3** — Founder reference layout, route motion, Financial Summary fix, brain rail — included in same release (`749922f` → `8a3b69d` → `2017e78`).

Parallel: **H1–H5 Production Apply** — H1 migration **repaired** **2026-07-27**; Production apply **pending** Founder retry via secure launcher.

**Personal Brain** — **DEFERRED BY FOUNDER — NOT PART OF CURRENT RELEASE**. Migration scaffold in source (`20260728000033`); UI **disabled** (`isPersonalBrainUiEnabled() === false`); **NOT applied** on Production. Non-Founder shell has **no** brain rail, placeholder, or reserved gutter.

**Global role-aware Home (Preview)** — `global-role-home-preview` branch; scoped V3 Home for Account Manager / Team Leader / Team; Personal Brain scope lock applied **2026-07-28** — **PENDING FOUNDER REVIEW** (Preview only; Production unchanged).

---

## CURRENT BLOCKERS

1. **Centered creation workspaces** — deployed to Production (`2017e78`); Founder must confirm New Order + New Client centered workspaces and New Quotation right drawer (agent cannot test authenticated session)
2. **Founder Home authenticated render** — included in Home V3 release; Founder must confirm Home loads after login
3. **H1–H5 migrations** not yet applied on Production — H1 SQL **repaired** (`person_id text`); apply via `scripts/apply-h-remediation-migrations.ts` (secure launcher)
4. Production credentials must **never** be stored in source / Git / logs / manifests / ZIPs
5. Restore drill script added (`scripts/restore-drill-disposable.ts`); SR-01 disposable rehearsal remains prior Gate 4 evidence on same backup
6. Non-Founder Production manual checks **not** assumed passed
7. **Personal Brain** — **DEFERRED BY FOUNDER — NOT PART OF CURRENT RELEASE** — scaffold only; do not apply migration `20260728000033` on Production without explicit Founder instruction; no non-Founder Brain UI

---

## SECURITY TRACK — Audit 2026-07-16 & SR-00

### Security / Product Audit (received 2026-07-16)

| Field | Value |
|--------|--------|
| **Report** | `docs/audits/SODA_OS_SECURITY_PRODUCT_AUDIT_2026-07-16.md` |
| **Mode** | READ-ONLY (source + docs; no Production data access) |
| **Overall rating** | **CRITICAL** |
| **C1** | **REMEDIATED / VERIFIED** — SR-01 closed; core domain RLS lockdown confirmed **2026-07-26** |
| **C2** | **REMEDIATED / VERIFIED** — SR-02 closed; founder-only creation paths confirmed **2026-07-27** |
| **H6 (auth footgun)** | **REMEDIATED / VERIFIED** — SR-00 closed; Production auth fail-closed confirmed **2026-07-26** |
| **H1–H5** | **REMEDIATED IN SOURCE** — migrations + app fixes **2026-07-27**; **Production apply PENDING** |

Overall audit rating is **MEDIUM-HIGH** — all **Critical** findings (**C1**, **C2**) and **H6** are remediated on Production; **H1–H5** remediated in source pending Production apply/deploy. Founder-primary Production is **OPERATIONAL WITH BACKUP**; broad multi-user Production is **not fully secure** until H1–H5 are applied on Production.

---

### MISSION SR-00 — Production Auth Fail-Closed

| Field | Value |
|--------|--------|
| **Status** | **CLOSED** |
| **Local RC mission** | **SR-00.1** |
| **Push / deploy / verify mission** | **SR-00.2** |
| **Release Candidate commit** | `ebf763e8ceb5d5db13a469219e4fe8beedecd983` |
| **Production deployment ID** | `dpl_82f5K6LVLAjpHAZ91nZzQJ2hyeGq` |
| **Production alias** | https://soda-os.vercel.app — **Ready** |
| **Verification date** | **2026-07-26** |
| **Founder manual verification** | **PASS** |
| **Next gate** | **SR-02 — Client-Side Domain Mutation Lockdown (C2)** |

**Goal:** `VERCEL_ENV=production` always forces strict authentication; `SODA_AUTH_STRICT=0` cannot disable auth or synthesize `fallbackOwnerSession()` on Production; middleware + session share one `auth-strict` source of truth.

**Local evidence (SR-00.1 — 2026-07-16):**

| Check | Result |
|--------|--------|
| `npx tsx scripts/verify-auth-strict.ts` | **PASS 8/8** |
| `npm run typecheck` | **PASS** |
| Targeted ESLint (`auth-strict.ts`, `session.ts`, `middleware.ts`, `verify-auth-strict.ts`) | **PASS** (0 errors) |
| `npm run lint` (repo baseline) | **FAIL** — 11 errors, 6 warnings (pre-existing; unrelated; not fixed in SR-00) |
| `npm run build` | **PASS** (local; no Production secrets used) |
| `git diff --check` (SR-00 scoped files) | **PASS** |

**Production evidence (SR-00.2 — 2026-07-26):**

| Check | Result |
|--------|--------|
| Security commit deployed to Production | **PASS** — `ebf763e8ceb5d5db13a469219e4fe8beedecd983` |
| Deployment state | **Ready** — `dpl_82f5K6LVLAjpHAZ91nZzQJ2hyeGq` |
| Signed-out redirect `/` → `/login` | **PASS** — HTTP 307 |
| Signed-out redirect `/brain` → `/login` | **PASS** — HTTP 307 |
| Signed-out redirect `/people` → `/login` | **PASS** — HTTP 307 |
| Signed-out redirect `/settings` → `/login` | **PASS** — HTTP 307 |
| Founder manual login / auth smoke test | **PASS** (Founder confirmed in chat) |
| H6 Production auth fallback | **REMEDIATED / VERIFIED** |

---

### MISSION SR-01 — Core Domain RLS Lockdown

| Field | Value |
|--------|--------|
| **Status** | **CLOSED** |
| **Security commit** | `0931c2624ac97a888e8cf6d26631a0723c72e943` (`0931c26`) |
| **Migration** | `20260726000028_sr01_core_domain_rls_lockdown.sql` |
| **Rollback** | `supabase/rollbacks/20260726000028_sr01_core_domain_rls_lockdown_rollback.sql` |
| **Verification date** | **2026-07-26** |
| **Founder manual verification** | **PASS** (`SR-01 MANUAL CHECK PASS`) |
| **Next gate** | **SR-02 — Client-Side Domain Mutation Lockdown (C2)** |

**Goal:** Replace permissive `using (true)` anon/authenticated RLS on **24** core business (C1) tables with Access Level–scoped policies; revoke anon DML; add `SECURITY DEFINER` helpers with `SET row_security = off` and `search_path = public`.

**Dependency note (Production prerequisite, not in SR-01 commit):** Migration `20260711000004_smart_order_engine_v3.sql` (`orders.squad_member_ids`) was applied on Production before SR-01 — required for order-scoped RLS helpers.

**C1 tables locked (24):** `workspaces`, `workspace_subcategories`, `people`, `equipment`, `equipment_assignments`, `projects`, `orders`, `order_assignments`, `quotations`, `payments`, `invoices`, `deliveries`, `financial_events`, `financial_allocations`, `files`, `clients`, `expenses`, `account_transfers`, `period_closings`, `cash_accounts`, `cash_account_movements`, `crew_earnings`, `business_events`, `audit_log`.

**SR-01 helpers (12):** `soda_is_domain_founder`, `soda_is_active_authenticated`, `soda_profile_access_level`, `soda_profile_person_id`, `soda_profile_display_name`, `soda_order_assigned_to_person`, `soda_person_shares_order_with`, `soda_can_access_order`, `soda_can_access_client`, `soda_can_access_person`, `soda_can_access_project`, `soda_can_access_quotation`.

**Local evidence (pre-Production):**

| Check | Result |
|--------|--------|
| `npx tsx scripts/verify-sr01-rls.ts` (static) | **PASS** — migration, rollback, 24 C1 tables, 12 helpers, anon revoke |
| Disposable rehearsal (`scripts/sr01-disposable-rehearsal.ts`) | **PASS** — Gates 3–5 on disposable PG 18 cluster; row counts match Gate 2 baseline |
| Rollback SQL reviewed | **PASS** — emergency restore path documented |

**Production evidence (2026-07-26):**

| Check | Result |
|--------|--------|
| Migration applied via pooler | **PASS** |
| `npx tsx scripts/verify-sr01-rls.ts --live` | **PASS 25/25** |
| C1 table row counts vs Gate 2 baseline | **PASS** — match |
| Backup / rollback readiness | **PASS** — Founder-verified Production DB backup package **2026-07-26** (readable; used for disposable rehearsal Gate 2 baseline; no secrets in manifest) |
| Founder manual SR-01 check | **PASS** |
| **C1** permissive domain RLS | **REMEDIATED / VERIFIED** |

**Authorization test matrix summary (live harness):**

| Actor / probe | Surface | Expected | Result |
|----------------|---------|----------|--------|
| `anon` | C1 tables — permissive policies | None (`using (true)`) | **PASS** |
| `anon` | `clients` SELECT | Denied (revoked grant or zero rows) | **PASS** |
| `authenticated` (Founder JWT sim) | `profiles` SELECT | No 42P17 recursion | **PASS** |
| `authenticated` (Founder JWT sim) | `clients` INSERT probe | Allowed under policy; rolled back | **PASS** |
| Catalog | 12 `soda_*` SR-01 helpers | Present | **PASS** |

**Disposable rehearsal tooling (not Production):** `scripts/sr01-disposable-rehearsal.ts` / `.ps1`; secure DB launcher `scripts/run-sr01-db-secure.ps1`.

---

### MISSION SR-02 — Client-Side Domain Mutation Lockdown

| Field | Value |
|--------|--------|
| **Status** | **CLOSED** |
| **Security commit** | `f1b2d4cf881bbc9a0d25810cd1660a274efba1f2` (`f1b2d4c`) |
| **Verification date** | **2026-07-27** |
| **Founder manual verification** | **PASS** (`SR-02 MANUAL CHECK PASS`) |
| **Next gate** | **High-Risk Remediation (H1–H5)** |

**Goal:** Move domain mutations behind `"use server"` actions with `mutation-auth` gates; restore founder-only order/client creation; remove Client Component → domain-db mutation paths (audit **C2**).

**Remediation implemented (source):** `lib/domain/mutation-auth.ts` (`requireFounder`, `resolveSessionForApp`); `lib/orders/actions.ts`, `lib/clients/actions.ts`, `lib/integration/actions.ts` gate creation with `requireFounder()`; client entry components (`order-entry-actions.tsx`, `client-entry-actions.tsx`) hide create UI for non-Founder.

**Local evidence (2026-07-27):**

| Check | Result |
|--------|--------|
| `npx tsx scripts/verify-sr02-mutation-boundary.ts` | **PASS** — 18/18 |
| `npx tsx scripts/verify-sr02-authz.ts` | **PASS** — 16/16 |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** (local; no Production secrets used) |
| Founder manual SR-02 check | **PASS** |
| **C2** ungated client domain mutations | **REMEDIATED / VERIFIED** |

---

### MISSION H1–H5 — High-Risk Remediation (Connect + Auth)

| Field | Value |
|--------|--------|
| **Status** | **SOURCE COMPLETE (H1 REPAIRED) — PRODUCTION APPLY PENDING** |
| **Verification date** | **2026-07-27** |
| **Migrations** | `20260727000029` (H1 — `person_id text` fix), `20260727000030` (H2), `20260727000031` (H4), `20260727000032` (H5) |
| **App fix** | `app/auth/callback/route.ts` (H3) |
| **Repository** | `lib/connect/repository.ts` (H1 RPC directory) |
| **Apply script** | `npx tsx scripts/apply-h-remediation-migrations.ts` (SQL errors surfaced distinctly from connection failures) |
| **Static harness** | `npx tsx scripts/verify-h-remediation.ts` — **PASS 11/11** |
| **Disposable H1** | `npx tsx scripts/verify-h1-disposable.ts` — **PASS** (minimal Production-shaped schema) |
| **Production catalog** | `npx tsx scripts/inspect-h1-production-catalog.ts` — **no partial apply** (0 H1 RPCs; legacy policy present) |

**Local evidence (2026-07-27):**

| Check | Result |
|--------|--------|
| `npx tsx scripts/verify-h-remediation.ts` | **PASS** — 11/11 |
| `npx tsx scripts/verify-h1-disposable.ts` | **PASS** — H1 applies on disposable PG |
| `npx tsx scripts/inspect-h1-production-catalog.ts` | **PASS** — no partial H1 on Production |
| `npx tsx scripts/verify-sr02-mutation-boundary.ts` | **PASS** — 18/18 |
| `npx tsx scripts/verify-sr02-authz.ts` | **PASS** — 16/16 |
| `npx tsx scripts/verify-auth-strict.ts` | **PASS** — 8/8 |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |
| Gate 2 backup (`SODA_Database_2026-07-26_195823.zip`) | **PASS** — readable; manifest present; 32 entries |
| Production migration apply (agent shell) | **BLOCKED** — Founder must retry via secure launcher after H1 repair |
| **H1–H5** on Production | **PENDING** Founder apply + deploy |

---

## RELIABILITY TRACK — Mission 08.x

### MISSION 08.0 — BACKUP CENTER (FOUNDATION)

| Field | Value |
|--------|--------|
| **Status** | FOUNDATION SHIPPED |
| **Commit** | `3795cc9` — `feat: add Founder-only Backup Center foundation` |
| **Surface** | Founder-only `/settings/backup` + `lib/backup/*` |
| **Notes** | Ops backup packages; secrets never exported; cloud providers are stubs; **restore intentionally disabled**; Vercel local FS is ephemeral |

---

### MISSION 08.1 — SOURCE CODE PROTECTION

| Field | Value |
|--------|--------|
| **Status** | **CLOSED** |
| **Commit** | `1ddfc6c92b6f3948f48902e86ff42f290b919b37` |
| **Verified output** | `D:\SODA OS\Versions\SODA_Source_0.1.0_2026-07-15.zip` |
| **Verification** | ZIP readable; **674** entries; `manifest.json` present; no `.env` / `node_modules` / `.next`; secrets excluded |
| **Docs** | `docs/SODA_MASTER/SOURCE_PROTECTION.md` |

---

### MISSION 08.2 — DATABASE PROTECTION

| Field | Value |
|--------|--------|
| **Status** | **VERIFIED** — Founder backup `SODA_Database_2026-07-26_195823.zip` (pg_dump; readable; used SR-01 Gate 2) |
| **Commit** | `1d801c930c36385da9bb8a195ea853f87826bf82` |
| **Verified** | `mode=dry_validate`; packaging OK; **28** migrations packaged; **NO** live Production schema/rows; needs secure Production DB connection |
| **Rule** | **Do NOT mark 08.2 as CLOSED** |
| **Docs** | `docs/SODA_MASTER/SOURCE_PROTECTION.md` (Database Protection section) |

Follow-on: **Mission 08.2.1** (live dump still pending).

---

### MISSION 08.3 — STORAGE PROTECTION

| Field | Value |
|--------|--------|
| **Status** | **CLOSED** |
| **Architecture commit** | `0c9a4255b6f80ab480eb602cfc78cc2b237038e3` |
| **Live completion commit** | `53a902a51c1fa395f6313880530939bce3e5b425` |
| **Verified** | `service_role`; project `wtjdqxzljtxzgykknspa` verified; **2** buckets (`soda-files`, `connect`); **remote objects = 0**; local `public/` = **19**; **failed = 0**; ZIP readable |
| **Output** | `D:\SODA OS\Storage\SODA_Storage_2026-07-15.zip` |

**Founder-confirmed fact:** Production buckets were enumerated successfully and contained **zero remote objects** at backup time.

---

## CONFIRMED ARCHITECTURE & PRODUCT DECISIONS (POINTERS)

These decisions remain in force. Detail lives in the dedicated SoT chapters — do not invent completion beyond what those docs and this Reliability / Security section record.

| Topic | Canonical reference |
|--------|---------------------|
| Official company name **SODA VISUALS** (never “SODA Studio”) | `README.md`, `docs/SODA_MASTER/AUTH_ARCHITECTURE.md` |
| Founder Data Policy — Production business data is sacred | `docs/SODA_MASTER/FOUNDER_DATA_POLICY.md` |
| Auth / Identity / People OS / Authority Center — no demo/seed Auth users | `docs/SODA_MASTER/AUTH_ARCHITECTURE.md` |
| Access Level Engine (Mission 04.4.5) | `docs/SODA_MASTER/ACCESS_LEVEL_MIGRATION.md` |
| Source / Database / Storage protection runbooks | `docs/SODA_MASTER/SOURCE_PROTECTION.md` |
| Security audit 2026-07-16 | `docs/audits/SODA_OS_SECURITY_PRODUCT_AUDIT_2026-07-16.md` |
| SODA MASTER governance | `docs/SODA_MASTER/00.01_SODA_MASTER_Overview.md` |

**Explicit non-claims:**

- Application feature modules (Orders, Finance, Team Chat / Connect, Notifications, Brain, Identity product UX) were **not** modified by the SR-00.1 documentation/auth-strict work beyond the scoped auth fail-closed files
- Mission **08.2** is **not** CLOSED
- Mission **SR-00** is **CLOSED** (SR-00.2 Production verification **2026-07-26**)
- Mission **SR-01** is **CLOSED** (Production RLS lockdown verification **2026-07-26**)
- Mission **SR-02** is **CLOSED** (founder-only creation paths verification **2026-07-27**)
- Mission **08.2** live Production backup **verified** (`SODA_Database_2026-07-26_195823.zip`; Mission 08.2.1 satisfied for Gate 2)
- **H1–H5** **REMEDIATED IN SOURCE**; Production apply **PENDING**
- Overall security audit rating is **MEDIUM-HIGH** — Founder-primary **OPERATIONAL WITH BACKUP**; broad multi-user **not fully secure** until H1–H5 Production apply
- A live Production **database** dump **exists** (Founder backup **2026-07-26**; SR-01 disposable rehearsal validated restore pattern)
- Restore Engine is **not** implemented / not executable from Backup Center

---

## CHANGE LOG

### v1.1.2 — 2026-07-28 (P0 Founder Home crash recovery)

**Incident:** Authenticated Founder Home on Production showed Next.js "Something went wrong" error boundary after Visual Reference Lock deploy (`bb841b7`).

**Root cause:** `FounderHomeStream` → `getBackupDashboardStatus()` → `readBackupIndex()` → `ensureRoot()` → `mkdirSync` on Vercel ephemeral/read-only filesystem (`data/backups`). Build passed because no runtime FS write occurs at build time; crash only on authenticated Founder Home Server Component render.

**Hotfix commit:** `f7bd477` — `fix(production): prevent backup status from crashing Founder Home`

**Changes:**
- `readBackupIndex()` — fail-soft read only; no `mkdirSync`; returns `[]` on missing/unreadable index
- `getBackupDashboardStatus()` — wrapped in try/catch with `fallbackBackupDashboardStatus()`; never throws to Home
- `scripts/verify-backup-home-resilience.ts` — 7-check harness

**Production deployment:**

| Field | Value |
|--------|--------|
| **Commit** | `f7bd4772fb6e981710de76d7c0c26520b07dec8c` |
| **GitHub deployment** | `5630695901` — **success** |
| **Deployment URL** | https://soda-gfrmsloab-soda-os.vercel.app |
| **Production alias** | https://soda-os.vercel.app — **Ready** |
| **HTTP smoke** | `/login` **200**; signed-out `/` → `/login` **307** |

**Verification (local):**

| Check | Result |
|--------|--------|
| `npx tsx scripts/verify-backup-home-resilience.ts` | **PASS 7/7** |
| `npx tsx scripts/verify-auth-strict.ts` | **PASS 8/8** |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |
| Targeted ESLint (hotfix files) | **PASS** |
| `git diff --check` (hotfix files) | **PASS** |

**Status:** **HOTFIX DEPLOYED — PENDING FOUNDER MANUAL VERIFICATION** (authenticated Home render).

### v1.1.1 — 2026-07-28 (Visual Reference Lock + Motion + Backup Repair)

**Scope:** UI/UX + Backup Center download repair only — no DB, auth, permissions, APIs, or business-logic changes.

**Reference-locked AppShell:**

- Compact sidebar (`w-56`), gradient pill active nav, profile card footer
- Removed main `overflow-hidden` clipping on operational content

**Reference-locked Founder Home:**

- 3-column main: Needs Your Decision | Recent Orders | Calendar / Today
- Compact status row: Team Activity, Pending Approvals, Unread Notifications, Storage (Founder)
- Action strip: New Order, Add Client, SODA Language guidance
- Screen 2: Financial Pulse, Quotation Pipeline, Team Availability, Studio Activity
- Removed max-height / overflow clipping CSS

**Motion:**

- `app/(shell)/template.tsx` + `RouteTransition` — exit 130ms, enter 220ms
- Sidebar pill animation, button press feedback, `prefers-reduced-motion`

**Backup Center:**

- `POST /api/backup/create` — in-memory ZIP streamed same request (Vercel ephemeral FS)
- Label: Recovery Metadata Package (honest metadata-only scope)

**Commits:** `f7c9093`, `bb841b7`, `ec617bc`, `d76c819`, `dac07f7`

**Verification (local):**

| Check | Result |
|--------|--------|
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |
| `npm run lint` | Baseline pre-existing errors (unchanged scope) |

**Status:** **PENDING FOUNDER VISUAL REVIEW** — reference PNGs not present in workspace; production HTTP smoke **PASS** after push.

### v1.1.0 — 2026-07-28 (SODA OS Visual System V2)

**Scope:** UI/UX only — design tokens V2, motion system, Founder Home two-screenful layout, route styling, reusable empty states. No DB, auth, permissions, APIs, or business-logic changes.

**Design foundation V2:**

- `lib/visual/v2.ts` — TS mirror for motion, typography, spacing, stagger/route-enter classes
- `app/globals.css` — status tokens, focus ring, route enter 240ms, card stagger 45ms, `.soda-route-enter`, `.soda-stagger-children`, `.soda-empty-state`
- Card titles 16–17px/semibold; motion `prefers-reduced-motion` respected

**Founder Home (1440×900):**

- Screenful 1: Arabic greeting, English date/time, snapshot KPIs, Today's Operations + Needs Your Decision, New Order + Add Client
- Screenful 2: Financial Pulse (when authorized), Quotation Pipeline, Team Availability, Recent Orders (real data only)
- `components/dashboard/founder-recent-activity.tsx` — recent orders panel

**Routes styled:**

- Shell route enter (`shell-frame.tsx`), Orders/Clients hub stagger, Settings card grid stagger
- Reusable `components/ui/soda-empty-state.tsx`

**Files changed:**

- `lib/visual/v2.ts`, `lib/brand/tokens.ts`, `app/globals.css`
- `components/ui/card.tsx`, `soda-empty-state.tsx`
- `components/dashboard/founder-*.tsx`, `founder-recent-activity.tsx`
- `components/layout/shell-frame.tsx`
- `components/clients/add-client-dialog.tsx`, `client-entry-actions.tsx`, `clients-hub.tsx`
- `components/orders/orders-hub.tsx`
- `app/(shell)/settings/page.tsx`

**Verification (local):**

| Check | Result |
|--------|--------|
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |
| `npm run lint` | Baseline pre-existing errors (unchanged scope) |
| `git diff --check` (mission files) | **PASS** |

**Status:** **DEPLOYED TO PRODUCTION** — pending Vercel Ready confirmation after push.

### v1.0.9 — 2026-07-27 (Founder Visual Revision — English UI + SODA Language)

**Scope:** UI/UX only — English-first operational labels, Arabic SODA Language guidance, Founder Home typography/layout. No DB, auth, permissions, APIs, or business-logic changes.

**English-first:**

- Operational chrome (nav, page titles, Founder Home cards, theme switcher, header actions) uses English via `lib/i18n/operational.ts` regardless of UI locale
- Live Western date/time on Founder header (`en-GB` — e.g. Monday, 27 July 2026 / 9:16 PM)
- Header actions: **New Order**, **Quick View** (`/attention`), theme **Light / Dark / System**
- DB values (client/crew/order names, statuses) remain untranslated

**SODA Language:**

- `components/brand/soda-language.tsx` — reusable Arabic guidance (`lang="ar"` `dir="rtl"`)
- `components/brand/soda-section-header.tsx` — English title + SODA Language block
- Extended `lib/brand/human-layer.ts` with Founder section keys (`needsYourDecision`, `todayOperations`, `financialPulse`, `teamAvailability`, snapshot keys)
- Shell pages keep Arabic guidance via `HumanTitle` / `AppShell` `layer` prop (Brain, Quotations, Orders, Clients, Crew, Calendar, Finance, Statistics, Team Chat, My Workspace)

**Founder Home labels (English):**

- Snapshot: Today's Orders, Needs Your Decision, Pending Collections, Pending Quotations
- Main: Today's Operations, Needs Your Decision
- Bottom: Financial Pulse, Quotation Pipeline, Team Availability
- Actions: New Order, View All, Quick View

**Typography:** Greeting clamp 30–36px/700; section titles 17–20px/600–700; body 15–16px; buttons 15px/600; metadata min 14px

**Files changed:**

- `lib/i18n/operational.ts`, `lib/brand/human-layer.ts`
- `components/brand/soda-language.tsx`, `soda-section-header.tsx`, `human-title.tsx`
- `components/dashboard/founder-*.tsx` (all six Founder Home modules)
- `components/layout/header.tsx`, `sidebar.tsx`, `shell-page-meta.tsx`
- `components/theme/theme-switcher.tsx`
- `app/globals.css`, `app/(shell)/me/page.tsx`

**Verification (local):**

| Check | Result |
|--------|--------|
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |
| `npm run lint` | Baseline pre-existing errors (unchanged scope) |
| 1440×900 no-scroll CSS | Applied (`minmax(0,1fr)` grid, max-height clamps) |
| Screenshots | **Pending Founder login** — `docs/screenshots/founder-redesign-2026-07-27/` |

**Status:** **DEPLOYED TO PRODUCTION** (**2026-07-27**).

**Production deployment:**

| Field | Value |
|--------|--------|
| **Commit** | `e04edbf` (`feat(ui): English-first Founder Home with SODA Language guidance`) |
| **Deployment ID** | Pending Vercel dashboard confirmation (agent shell: no `gh` / `VERCEL_TOKEN`; HTTP smoke **PASS**) |
| **Production alias** | https://soda-os.vercel.app — **Ready** (`/login` **200**; signed-out `/` → `/login` **307**) |
| **Previous deploy** | `dpl_5H51fxEhAYoGUGcpRj5jxSaEys9Z` (v1.0.8 / `b731209`) |

Founder manual viewport / screenshot capture still recommended (`docs/screenshots/founder-redesign-2026-07-27/`).

- Deploy Founder Home / Sidebar visual redesign to Production — commit `b731209e96aad8181a5ce78b769474748ee51463`
- Vercel deployment `dpl_5H51fxEhAYoGUGcpRj5jxSaEys9Z` — **Ready** on https://soda-os.vercel.app
- Pre-deploy gates: `npm run typecheck` **PASS**; `npm run build` **PASS**
- HTTP smoke: `/login` **200**; signed-out `/` → `/login` **307**

### v1.0.7 — 2026-07-27 (Founder Home & Sidebar Visual Redesign — UI/UX only)

**Scope:** UI/UX only — no database, auth, permissions, APIs, or business-logic changes.

**Visual changes:**

- **Sidebar:** Flat primary nav (Home → Team Chat order); hide Projects, Commercial, Weddings, Equipment from display only; collapsible icon rail; My Workspace accordion (closed by default); Founder hides Target/Bonus/Penalties from sidebar; tooltips when collapsed; SODA logo preserved
- **Founder Command Center:** Compact Arabic greeting header with live clock, theme toggle, key actions; daily snapshot (4 KPIs); two-column main (Operations Today + Needs Your Decision); bottom pulse row (financial, quotations, team); warm ivory light mode + deep aubergine night mode via existing tokens
- **Shell:** `compactChrome` on Founder Home — slimmer header, no breadcrumbs/recently-viewed, tighter padding; no-scroll CSS target at 1440×900

**Files changed:**

- `lib/identity/nav.ts` — sidebar display filter + order
- `components/layout/sidebar.tsx` — redesign
- `components/layout/shell-frame.tsx`, `shell-context.tsx`, `shell-page-meta.tsx`, `header.tsx`, `app-shell.tsx`
- `components/dashboard/founder-command-header.tsx`, `founder-daily-snapshot.tsx`, `founder-operations-today.tsx`, `founder-needs-decision.tsx`, `founder-bottom-pulse.tsx`, `founder-home-stream.tsx`
- `app/(shell)/page.tsx`, `app/globals.css`

**Preserved:** All routes/pages, real data queries, RTL Arabic copy, permission logic, SODA Brain naming, loading/error/empty states.

**Verification (local):**

| Check | Result |
|--------|--------|
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS** |
| ESLint (changed files) | **PASS** |
| Night/Light theme toggle | Implemented (existing mechanism) |
| 1440×900 no-scroll | CSS layout applied; **Founder manual viewport check recommended** |
| Screenshots | Directory: `docs/screenshots/founder-redesign-2026-07-27/` — capture after Founder login |

**Status:** **DEPLOYED TO PRODUCTION** (**2026-07-27**).

**Production deployment:**

| Field | Value |
|--------|--------|
| **Commit** | `b731209e96aad8181a5ce78b769474748ee51463` (`feat(ui): Founder Home and Sidebar visual redesign`) |
| **Deployment ID** | `dpl_5H51fxEhAYoGUGcpRj5jxSaEys9Z` |
| **Deployment URL** | https://soda-evosi1hra-soda-os.vercel.app |
| **Production alias** | https://soda-os.vercel.app — **Ready** |
| **HTTP smoke** | `/login` **200**; signed-out `/` → `/login` **307** |

Founder manual viewport / screenshot capture still recommended (`docs/screenshots/founder-redesign-2026-07-27/`).

### Centered Creation Workspaces — 2026-07-28

**Goal:** Founder-approved interaction correction — New Order and New Client open as centered animated workspaces; New Quotation remains right-side drawer. Merge Home V3 + Motion V3 preview into `main`; deploy to Production.

| Field | Value |
|--------|--------|
| **Interaction commit** | `2017e786cf1c2da8c1c7d291bf3f8cb2a572c570` (`2017e78`) |
| **Merge base** | `d12170f5aaef7eb1e5964dc3c41b9a3b602f944c` (`origin/main` before merge) |
| **Preview branch** | `home-v3-reference-preview` |
| **Production alias** | https://soda-os.vercel.app |
| **Production commit (post-push)** | `2017e78` on `origin/main` |
| **Vercel deployment ID** | **Unconfirmed** — CLI TLS error; HTTP smoke **PASS** (`/login` **200**) |
| **Personal Brain migration** | **NOT applied** on Production — **DEFERRED BY FOUNDER — NOT PART OF CURRENT RELEASE** (scaffold in source only) |

**Interaction changes:**

| Flow | Presentation |
|------|----------------|
| **New Order** | Centered large workspace — `min(1100px, calc(100vw - 80px))`, max-height ~90vh; open 720ms scale 0.96 + translateY 20px; close 550ms reverse |
| **New Client** | Centered medium workspace — `min(720px, calc(100vw - 80px))`, max-height ~85vh; open 585ms scale 0.96 + translateY 16px; close 500ms reverse |
| **New Quotation** | **Unchanged** — right-side drawer |

**Verification (automated — 2026-07-28):**

| Check | Result |
|--------|--------|
| `npm run typecheck` | **PASS** |
| `npx tsx scripts/verify-creation-interactions.ts` | **PASS 13/13** |
| `npx tsx scripts/verify-home-v3-reference.ts` | **PASS 11/11** |
| `npx tsx scripts/verify-sr02-authz.ts` | **PASS 16/16** |
| `npx tsx scripts/verify-sr02-mutation-boundary.ts` | **PASS 18/18** |
| `npm run build` | **PASS** |
| `npm run lint` (full repo) | **FAIL** — pre-existing errors (unrelated files; not introduced by this mission) |
| `npx tsx scripts/verify-founder-home-mission.ts` | **FAIL** — pre-existing Motion V3 route timing (820ms vs V2 650ms expectation) |
| `git diff --check` (scoped mission files) | **PASS**; unrelated `SOURCE_PROTECTION.md` trailing whitespace pre-existing |
| Production `/login` HTTP smoke | **PASS** — **200** |
| Founder authenticated creation flows | **PENDING** — manual checklist required |
| Preview screenshots / video | **NOT CAPTURED** — browser MCP unavailable; Preview URL pattern unconfirmed |

**Status:** **DEPLOYED TO PRODUCTION** — automated gates **PASS**; Founder manual verification **PENDING**.

### v1.0.5 — 2026-07-27

- Complete **H1–H5** source remediation — migrations `20260727000029`–`32`, H3 auth callback allowlist, H1 Connect repository RPCs
- Add `scripts/verify-h-remediation.ts` (**10/10 PASS**), `scripts/apply-h-remediation-migrations.ts`, `scripts/restore-drill-disposable.ts`
- Gate 2 backup **verified** — `D:\SODA OS\Database\SODA_Database_2026-07-26_195823.zip` (manifest present; 32 entries)
- Production migration apply **BLOCKED** from agent shell (DB host unreachable); status **SOURCE COMPLETE — PRODUCTION APPLY PENDING**
- Overall audit **MEDIUM-HIGH**; decision **OPERATIONAL WITH BACKUP** (Founder-primary); multi-user **not fully secure** until Production apply + deploy

### v1.0.4 — 2026-07-27

- Close **SR-02** — Client-Side Domain Mutation Lockdown verified (**2026-07-27**)
- Record security commit `f1b2d4cf881bbc9a0d25810cd1660a274efba1f2` (`f1b2d4c`); Founder manual **PASS** (`SR-02 MANUAL CHECK PASS`)
- Mark **C2** ungated client domain mutations **REMEDIATED / VERIFIED**; local harness **18/18** + **16/16**; typecheck + build **PASS**
- Keep **H1–H5** and Mission **08.2.1** live DB backup gap **OPEN**; overall audit **HIGH** — multi-user Production **not fully secure**
- Set next security gate to **High-Risk Remediation (H1–H5)**

### v1.0.3 — 2026-07-26

- Close **SR-01** — Core Domain RLS Lockdown verified on Production (**2026-07-26**)
- Record security commit `0931c2624ac97a888e8cf6d26631a0723c72e943`; migration `20260726000028_sr01_core_domain_rls_lockdown.sql`
- Mark **C1** permissive domain RLS **REMEDIATED / VERIFIED**; live harness **25/25**; row counts match Gate 2 baseline; Founder manual **PASS**
- Document Production prerequisite `20260711000004_smart_order_engine_v3.sql` (`orders.squad_member_ids`) — applied before SR-01, not part of SR-01 commit
- Keep **C2**, **H1–H5**, and Mission **08.2.1** live DB backup gap **OPEN**; overall audit remains **CRITICAL**
- Set next security gate to **SR-02 — Client-Side Domain Mutation Lockdown (C2)**

### v1.0.2 — 2026-07-26

- Close **SR-00** — Production auth fail-closed verified on https://soda-os.vercel.app (**SR-00.2**)
- Record RC commit `ebf763e8ceb5d5db13a469219e4fe8beedecd983`; deployment `dpl_82f5K6LVLAjpHAZ91nZzQJ2hyeGq` (**Ready**)
- Record automated signed-out redirect evidence (`/`, `/brain`, `/people`, `/settings` → `/login`, HTTP 307) and Founder manual verification **PASS**
- Mark **H6** Production auth fallback **REMEDIATED / VERIFIED**; **H1–H5** remain **OPEN**
- Keep **C1**, **C2**, and live Production database backup gap **OPEN**
- Set next security gate to **SR-01 — Core Domain RLS Lockdown**

### v1.0.1 — 2026-07-16

- Record Security / Product Audit received **2026-07-16** (overall **CRITICAL**); C1/C2 remain **OPEN**
- Record **SR-00** Production auth fail-closed: **ARCHITECTURE COMPLETE — LIVE VERIFICATION PENDING** (local SR-00.1 RC verified; no Production deploy)
- Document local test evidence (verify-auth-strict 8/8, typecheck, targeted ESLint, build, diff --check; repo lint baseline separately)
- Set next security gate to **SR-00.2** (push/deploy/runtime verify); do **not** mark SR-00 CLOSED
- Keep Mission **08.2.1** / live DB backup as open reliability blocker

### v1.0.0 — 2026-07-15

- Inaugurate official Master Project State at this path (no prior file existed in repo or Founder source ZIP)
- Record Founder-verified Reliability status for Missions **08.0**, **08.1**, **08.2**, **08.3**
- Set CURRENT MISSION to **08.2.1** and CURRENT BLOCKERS accordingly
- Encode Permanent Reliability Rule + Single Source of Truth Rule
