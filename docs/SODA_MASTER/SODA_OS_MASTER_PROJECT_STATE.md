# SODA OS — MASTER PROJECT STATE

**Official path (ONLY active source of truth):**  
`docs/SODA_MASTER/SODA_OS_MASTER_PROJECT_STATE.md`

| Field | Value |
|--------|--------|
| **Document version** | `1.0.4` |
| **Last updated** | `2026-07-27` |
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

**High-Risk Remediation (H1–H5)** — next security gate after SR-02 closure.

Parallel reliability work remains open: **Mission 08.2.1 — Live Production Database Backup Completion**.

---

## CURRENT BLOCKERS

1. Real Production database dump **not yet created**
2. Mission 08.2 verified only as **`mode=dry_validate`** (architecture complete; live Production backup pending)
3. Production credentials must **never** be stored in source / Git / logs / manifests / ZIPs
4. Restore execution remains **disabled** until a dedicated Restore Engine mission
5. Security audit **H1–H5** remain **OPEN** — multi-user Production is **not fully secure**

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
| **H1–H5** | **OPEN** — unchanged from audit 2026-07-16 |

Overall audit rating is **HIGH** — all **Critical** findings (**C1**, **C2**) and **H6** are remediated; **H1–H5** remain **OPEN**. Multi-user Production is **not fully secure** until **H1–H5** are addressed.

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
| **Status** | **ARCHITECTURE COMPLETE — LIVE PRODUCTION DATABASE BACKUP PENDING** |
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
- **C1** and **C2** are **REMEDIATED / VERIFIED**; **H1–H5** remain **OPEN**
- Overall security audit rating is **HIGH** — multi-user Production is **not fully secure** until **H1–H5** are addressed
- A live Production **database** dump does **not** yet exist (Founder backup **2026-07-26** verified for SR-01 rehearsal only; Mission **08.2.1** remains open)
- Restore Engine is **not** implemented / not executable from Backup Center

---

## CHANGE LOG

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
