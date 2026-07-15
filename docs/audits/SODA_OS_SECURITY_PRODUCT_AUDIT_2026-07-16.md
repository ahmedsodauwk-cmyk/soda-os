# SODA OS — Security, Product & UX Audit

| Field | Value |
|--------|--------|
| **Date** | 2026-07-16 |
| **Mode** | READ-ONLY (source + docs + non-destructive commands) |
| **Workspace** | `C:\Users\ahmed\soda-os` |
| **Production** | https://soda-os.vercel.app/ |
| **Official state** | `docs/SODA_MASTER/SODA_OS_MASTER_PROJECT_STATE.md` (v1.0.0, 2026-07-15) |
| **App version** | `0.1.0` |
| **Auditor** | Automated source audit (no Production data access, no exploits) |

**Classification keys:** `CONFIRMED` · `LIKELY` · `NEEDS RUNTIME TEST` · `NOT TESTABLE FROM SOURCE`

---

## 1. Executive Summary

SODA OS has a **strong Access Level product model** (Crew → Job Title → Access Level → optional `role_permissions`) with serious fail-closed session work after the 42P17 profiles RLS incident. Shell routing (`canAccessPath`), Home scoping (`buildDataScope`), Brain Founder actions, and Backup Founder gates are thoughtfully designed.

However, **database Row Level Security for core business tables remains in the pre-auth “permissive” phase** (`using (true)` for `anon` and `authenticated`). Combined with the public anon key and Client Components that call domain repositories/engines directly, **Supabase REST is an authorization bypass of the Access Level Engine**. App-layer gates do not protect the data plane.

Additionally, a documented env footgun (`SODA_AUTH_STRICT=0`) synthesizes a Founder session when auth is absent—catastrophic if ever set on Vercel Production.

**Verdict:** Development may continue only behind strict operational restrictions; the open domain RLS must be treated as a **Production release blocker** for any real business data beyond empty/dev state.

---

## 2. Overall Risk Rating

# **CRITICAL**

| Metric | Count |
|--------|------:|
| Confirmed Critical | **2** |
| Confirmed High | **6** |
| Confirmed Medium | **8** |
| Confirmed Low / Info | several |
| Likely / Needs runtime | noted in §19 |

---

## 3. Product Strengths

1. **Access Level Engine documented and coded** — Job Title ≠ permissions; Founder not inviteable; deny-by-default parse (`lib/identity/access-levels.ts`).
2. **Session fail-closed on 42P17 / profile SELECT errors** — no Soft-Team demotion of Founder (`lib/identity/session.ts` ~224–231).
3. **Module matrix + data scope** — Team/TL/AM scoped lists; finance pulse Founder-only helpers (`module-access.ts`, `data-scope.ts`).
4. **Profiles RLS recursion hotfixes** exist (`20260714000019`, `20260715000026`, `20260715000027`) with `SECURITY DEFINER` + `SET row_security = off`.
5. **Brain ERP safety in product design** — understand → approve → execute; Founder-only actions (`lib/brain/actions.ts`).
6. **Connect** has membership helpers, mime allowlists, path upload under `{userId}/…`.
7. **Founder Data Policy / AUTH architecture** — no demo seed users; Crew Workspace provisioning (`docs/SODA_MASTER/*`).
8. **Backup Center** restore disabled; secrets scrubbing in snapshot tooling; Founder gate on download API.
9. **Shell boot budget** (`BOOT_BUDGET_MS = 3000`) prevents infinite splash hangs.
10. **`npm run typecheck`** passes (2026-07-16).

---

## 4. Critical Findings

### C1 — Permissive anon/authenticated RLS on core business tables
| Field | Value |
|--------|--------|
| **Classification** | CONFIRMED |
| **Severity** | Critical |
| **Area** | C Supabase/RLS · B Authorization · D API surface |
| **Explanation** | Pre-auth migrations enable RLS then allow full CRUD for `anon` and `authenticated` with `using (true)`. Anyone holding `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` can read/write clients, orders, people, finance, etc. via PostgREST **without** Access Level checks. |
| **Evidence** | `supabase/migrations/20260711000003_modules_rls.sql` L1–4, L39–71 (tables include `people`, `orders`, `financial_events`, `files`, …); `supabase/migrations/20260711000002_clients_rls.sql` L1–3, L18–52; similar `using (true)` in financial_core / business_rules / business_core migrations. No later migration in-repo tightens these policies. |
| **Business impact** | Full company CRM/ERP leakage and tampering; violates Founder Data Policy for Production data. |
| **Safe verification** | In Dashboard → Authentication: confirm policies on `public.clients` / `public.orders` still `using (true)` for `anon`. Do **not** dump rows. Optionally call REST with anon key against a **non-Production** project only. |
| **Recommended fix** | Replace policies with Access Level / membership-scoped RLS; revoke `anon` DML; force all mutations through authenticated Server Actions with gates. |
| **Blocks Production?** | **YES** for any real business data. |

### C2 — Client Components mutate domain data without Server Action authz
| Field | Value |
|--------|--------|
| **Classification** | CONFIRMED |
| **Severity** | Critical |
| **Area** | D API/Server Actions · B Authorization |
| **Explanation** | Order create/update/delete paths are invoked from `"use client"` components importing engines/repositories directly. On the client, `createDomainDb()` uses the **anon** key (`typeof window !== "undefined"` → no service role). There is no `getSodaSession` / Access Level check in `createSmartOrder` / `createOrder`. Combined with C1, Team (or unauthenticated PostgREST) can write company orders. |
| **Evidence** | `components/orders/order-entry-actions.tsx` L1, L10–32; `components/orders/orders-content.tsx` (imports `updateSmartOrder`, `deleteOrder`); `lib/supabase/domain-db.ts` L13–22; `lib/orders/engine.ts` `createSmartOrder` L386+ (no session gate). |
| **Business impact** | Access Level Engine is UI/shell theatre relative to the data plane; unauthorized create/edit/delete. |
| **Safe verification** | Code review only on Production; confirm Network tab on a staging deploy whether browser calls Supabase REST for inserts (no exploitation on live data). |
| **Recommended fix** | Wrap all mutations in `"use server"` actions with `resolveSessionForApp` + permission/scope checks; stop importing domain-db from Client Components. |
| **Blocks Production?** | **YES**. |

---

## 5. High Findings

### H1 — `profiles_select_connect_peers` exposes all active profiles to any active user
| Field | Value |
|--------|--------|
| **Classification** | CONFIRMED |
| **Severity** | High |
| **Area** | C RLS · H Connect · B Authz |
| **Explanation** | Second SELECT policy OR-combined with own/admin policy: any active authenticated user can SELECT every active profile (email, access_level, person_id, …). Needed for Connect directory, but is company-wide PII enumeration. |
| **Evidence** | `20260715000024_soda_connect_foundation.sql` ~L569–575; hotfixes `000026`/`000027` preserve same breadth; `lib/connect/repository.ts` ~L192–197 selects those columns. |
| **Business impact** | Crew emails, access tiers, identity links visible to all Team users. |
| **Safe verification** | As a Team test account on staging: `select` peers; confirm column set. |
| **Recommended fix** | Narrow SELECT to id/display fields; hide email/access_level except Founder; or directory view table. |
| **Blocks Production?** | Soft-block for multi-user Production; fix before broad crew rollout. |

### H2 — Connect Storage SELECT allows any authenticated user to read entire `connect` bucket
| Field | Value |
|--------|--------|
| **Classification** | CONFIRMED |
| **Severity** | High |
| **Area** | F Storage · H Connect |
| **Explanation** | INSERT/UPDATE/DELETE scoped to `auth.uid()` folder; SELECT only checks `bucket_id = 'connect'`. Cross-user object read if paths known/guessable. |
| **Evidence** | `20260715000024_soda_connect_foundation.sql` ~L584–587 vs L590–612; uploads at `lib/connect/upload-client.ts` L34–35. |
| **Business impact** | Private chat attachments leak across crew. |
| **Safe verification** | Staging: user A uploads; user B requests signed URL / download of A’s path (do not use Production objects). |
| **Recommended fix** | SELECT policy: `(storage.foldername(name))[1] = auth.uid()::text` or conversation-membership join. |
| **Blocks Production?** | Soft-block once Connect files are used (Master State: remote objects were 0 at last backup). |

### H3 — Auth callback open redirect via `next`
| Field | Value |
|--------|--------|
| **Classification** | CONFIRMED |
| **Severity** | High |
| **Area** | A Auth · D Inputs |
| **Explanation** | After code exchange, redirect uses `next` if it `startsWith("/")`. Values like `//evil.example` can produce protocol-relative redirects in many browsers. Exchange errors ignored. |
| **Evidence** | `app/auth/callback/route.ts` L8–18. |
| **Business impact** | Phishing after invite/reset; session fixation narratives. |
| **Safe verification** | Staging only: hit `/auth/callback?next=//example.com` without real codes; observe Location header. |
| **Recommended fix** | Allowlist relative paths (`/^\/(?!\/)/`), reject `//`, encode; check `exchangeCodeForSession` error. |
| **Blocks Production?** | Should fix before growth; not the highest data risk. |

### H4 — `handle_new_user` can adopt privileged roles from signup metadata
| Field | Value |
|--------|--------|
| **Classification** | CONFIRMED (code) / NEEDS RUNTIME TEST (signup enabled?) |
| **Severity** | High |
| **Area** | A Auth · C DB triggers |
| **Explanation** | Trigger sets `chosen_role` from `raw_user_meta_data->>'role'` including `owner` / `admin` / `founder` when profiles already exist. Dangerous if public Email signup is open. |
| **Evidence** | `20260713000013_people_os_foundation.sql` ~L347–360; AUTH_ARCHITECTURE says invite-only / no seed users. |
| **Business impact** | Privilege escalation to Founder-equivalent role labels (authorization primarily uses `access_level`, but legacy mapping can elevate). |
| **Safe verification** | Dashboard → Auth → Providers: confirm signup disabled; inspect trigger definition live. |
| **Recommended fix** | Ignore client-supplied privileged roles; always default new non-first users to `crew_member` + `access_level=team`. |
| **Blocks Production?** | YES if open signup; otherwise harden anyway. |

### H5 — Connect messages UPDATE: any conversation member can update any message
| Field | Value |
|--------|--------|
| **Classification** | CONFIRMED |
| **Severity** | High |
| **Area** | H Connect · C RLS |
| **Explanation** | Policy requires membership AND (`sender_id = auth.uid()` OR `connect_is_member(...)`) — second clause collapses to “any member”. |
| **Evidence** | `20260715000024_soda_connect_foundation.sql` L459–466. |
| **Business impact** | Message forgery / edit of peers’ messages. |
| **Safe verification** | Staging: member B updates message row of member A via REST. |
| **Recommended fix** | `USING (sender_id = auth.uid() AND connect_is_member(...))`. |
| **Blocks Production?** | Soft-block for Connect trust. |

### H6 — `SODA_AUTH_STRICT=0` synthesizes Founder session + opens middleware
| Field | Value |
|--------|--------|
| **Classification** | CONFIRMED (footgun) · NEEDS RUNTIME TEST (Vercel env value) |
| **Severity** | High (Critical **if** set on Production) |
| **Area** | A Auth · E Secrets/env · D Actions |
| **Explanation** | When not strict, unauthenticated requests pass middleware and `resolveSessionForApp()` returns `fallbackOwnerSession()` with `accessLevel: "founder"`. Many sensitive actions use `resolveSessionForApp` (Authority, Backup, People mutations, Connect, Brain). Documented in `.env.example`. |
| **Evidence** | `lib/identity/session.ts` L426–465; `middleware.ts` L28–65, L75–77; `lib/backup/access.ts` L8–12; `.env.example` L25–27. |
| **Business impact** | Unauthenticated Founder takeover of the app layer. |
| **Safe verification** | Vercel → Environment Variables: confirm `SODA_AUTH_STRICT` unset or `1` for Production (do not paste values). Spot-check Production redirects to `/login` when logged out. |
| **Recommended fix** | Ignore `SODA_AUTH_STRICT=0` when `VERCEL_ENV === "production"`; never document Production=0; use Preview-only overrides. |
| **Blocks Production?** | **YES if env mis-set**; verify immediately. |

---

## 6. Medium Findings

### M1 — Domain repositories prefer service role (bypass RLS on server)
| Classification | CONFIRMED | Severity | Medium |
| Area | C · D |
| Evidence | `lib/supabase/domain-db.ts` L8–22; Brain/orders/clients/people/finance repos. |
| Impact | App authz is the only gate; any ungated server call = full data access. |
| Fix | Prefer user-scoped client + tight RLS; keep service role for admin scripts only. |
| Blocks Production? | Amplifies C1/C2; fix with RLS redesign. |

### M2 — Bootstrap remains publicly routed
| Classification | CONFIRMED | Severity | Medium |
| Area | A |
| Evidence | `middleware.ts` PUBLIC `/bootstrap`; `bootstrapOwnerAction` zero-`owner` check L251–264; counts `role=owner` only (not `access_level=founder`). |
| Impact | Extra Founder if no `owner` rows remain / policy drift. |
| Fix | Disable route when Founder exists; check `access_level='founder'` too; IP / secret gate. |

### M3 — `resolve_login_email` / username enumeration
| Classification | CONFIRMED | Severity | Medium |
| Area | A · C |
| Evidence | Auth brand foundation grants resolver to anon (session code uses it from login). |
| Impact | Account enumeration. |
| Fix | Constant-time responses; rate limit. |

### M4 — No per-user custom permission overrides beyond Access Level templates
| Classification | CONFIRMED (gap vs brief model) | Severity | Medium (product) |
| Area | B |
| Evidence | No `profile_permissions` table; SoT is `profiles.access_level` + `role_permissions` keyed by level (`permission-service.ts` L1–9). |
| Impact | “Optional Custom Permissions” per person not implemented; Founder can only change Access Level or edit templates globally. |
| Fix | Document as deferred OR add opt-in overrides with deny-by-default. |

### M5 — `soda-files` bucket lacks in-repo storage.object policies
| Classification | CONFIRMED (migrations) · NEEDS RUNTIME TEST (live policies) | Severity | Medium |
| Area | F |
| Evidence | Bucket create in `20260712000008_smart_ops.sql` ~L100–104; no matching SELECT/INSERT policies in migrations. |
| Impact | Either uploads fail or Dashboard policies differ from SoT. |
| Fix | Version bucket policies in migrations. |

### M6 — Presence SELECT `using (true)`
| Classification | CONFIRMED | Severity | Medium |
| Area | H |
| Evidence | `connect_presence_select` L534–537. |
| Impact | All users see all presence rows (may be intentional). |

### M7 — Finance page fetches ledgers before RoleGate render
| Classification | CONFIRMED | Severity | Medium |
| Area | B · J |
| Evidence | `app/(shell)/finance/page.tsx` L39–50 refresh* then RoleGate ~L317. Layout `canAccessPath` blocks Team from `/finance`. |
| Impact | Low user-data leak risk if layout holds; wastes work; dangerous if path matrix drifts. |
| Fix | Gate session/permissions before refresh*. |

### M8 — `is_brain_founder()` lacks explicit `SET row_security = off`
| Classification | LIKELY | Severity | Medium |
| Area | C · G |
| Evidence | `20260714000020_soda_brain_foundation.sql` L186–201 vs profiles helpers with `row_security=off`. |
| Impact | Possible recursion/latency if profiles policies re-enter. |
| Fix | Align helper with hardened pattern (plpgsql + `row_security=off`). |

### M9 — ESLint failures (11 errors)
| Classification | CONFIRMED | Severity | Medium (quality) |
| Area | J Maintainability |
| Evidence | `npm run lint` exit 1 (React setState-in-effect, prefer-const, etc.). |
| Impact | Signal hygiene risk; not a direct vuln. |

### M10 — No app-level rate limiting on auth / Connect / Brain actions
| Classification | CONFIRMED | Severity | Medium |
| Area | D · A |
| Evidence | No rate-limit middleware/tokens in repo for login or actions. |
| Impact | Brute force / spam. |
| Fix | Rely on Supabase Auth rate limits + add edge/WAF limits. |

---

## 7. Low Findings

1. **`bootstrap_needed()` granted to anon** — existence leak (identity_nav migration). Low.
2. **XSS surface small** — single theme boot `dangerouslySetInnerHTML` with constant cookie name (`app/layout.tsx`). Low.
3. **CSRF** — relies on Next.js Server Action defaults; no custom Origin checks. Info / NEEDS RUNTIME for Next 16 posture.
4. **Hardcoded Soft-Team / local Founder names** in fallbacks — local-only when non-strict. Low if Production strict.
5. **`.env.example` placeholder password text** for bootstrap CLI — documentation smell; no live secrets. Low.
6. **Lint unused vars** in brain stub / authority-actions — Low.

---

## 8. Authentication Review

| Topic | Assessment |
|--------|------------|
| Login | Username/email via `resolveLoginEmail` + `signInWithPassword` (`lib/auth/actions.ts`). |
| Logout | `signOutAction` clears session; continues to `/login` even if remote revoke fails. |
| Middleware | Cookie presence fast-path; `getUser()` when cookies present; Production strict by default (`VERCEL_ENV`). |
| Must-change password | Shell forces `/settings/password` (`layout.tsx` L53–59). |
| Session strictness | Fail closed on recursion; Soft-Team only for missing profile + insert fail + non-strict. |
| Bootstrap | Public page; service-role create; disabled when active `owner` exists. |
| Gaps | H3 open redirect; H4 metadata roles; H6 strict=0 footgun; M2 bootstrap counts only `owner`. |
| Server vs UI | Shell + RoleGate are server-side for **pages**; **data plane is not** (C1/C2). |

---

## 9. Authorization & Data Scope Review

**Official model (docs + code):** Access Level grants permission sets; Job Title/role is display/ops; Founder unique/non-assignable via invite.

| Level | App matrix | Data scope intent |
|--------|------------|-------------------|
| Founder | all paths | company-wide |
| Account Manager | quotes/orders/clients/… | commercial + assigned quotes |
| Team Leader | orders/people/calendar/… | squad-linked orders |
| Team | orders/calendar/connect/… | personal assignments only |

**Strengths:** `buildDataScope` honest-empty when `personId` null; finance events Founder-only; `canAccessPath` redirects hidden modules.

**Weaknesses:** Scope is in-memory after refresh — not RLS; Client Component mutations ignore scope; AM “all commercial orders” may be wider than Founder intends; custom per-user permissions missing (M4); Authority/Backup/People Founder actions depend on session helper (H6).

**IDOR:** Conversation IDs / message IDs — Connect RLS partially protects; H5 update policy weak; storage H2. Order IDs — unprotected at DB.

---

## 10. Supabase / RLS Review

| Item | Status |
|--------|--------|
| 42P17 profiles recursion | **Patched in repo** via SECURITY DEFINER helpers + peers policy rewrite. **NEEDS RUNTIME TEST** that Production applied `000027`. |
| Remaining recursive patterns | Peers policy no longer SELECTs profiles inside profiles policy expression. `is_brain_founder` still SELECTs profiles (M8). |
| Domain RLS | **Still permissive** (C1) — primary finding. |
| Brain RLS | Founder-only policies exist; bypassed by service-role domain-db on server. |
| Connect RLS | Membership-aware for many tables; H5 update; presence open; profiles peers broad (H1). |
| Grants | Broad table grants to `anon`/`authenticated` accompany permissive policies. |
| Service role | Used correctly for provisioning/admin; overused for domain repos (M1). |

---

## 11. API & Server Actions Review

| Surface | Authz | Notes |
|----------|--------|--------|
| `GET /api/backup/[id]/download` | Founder via `requireBackupFounder` | Path traversal rejected (`..`, `/`, `\`). Vulnerable if H6. |
| Auth / Authority / People / Brain / Connect / Backup actions | Session gated (mostly) | Prefer `resolveSessionForApp` (fallback risk) vs `getSodaSession` (invite). |
| Order engine / repository | **None** | Called from Client Components (C2). |
| Input validation | Partial | Password length ≥8; Connect mime allowlist; backup id sanitize. No systematic schema (zod) layer. |
| Logging | Some `console.error` with messages; avoid logging tokens (no secrets observed in code paths reviewed). |
| Rate limit | Missing (M10). |

---

## 12. Secrets & Environment Review

**Variable names only (no values inspected or printed):**

| Name | Exposure |
|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (expected) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (expected) — dangerous with C1 |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only helper; must never ship to client |
| `DATABASE_URL` / `SUPABASE_DB_URL` / `DIRECT_URL` / `POSTGRES_URL` | Backup/scripts |
| `SUPABASE_DB_PASSWORD` / `POSTGRES_PASSWORD` | Scripts |
| `SODA_AUTH_STRICT` | Auth mode |
| `NEXT_PUBLIC_SITE_URL` / `VERCEL_URL` | Redirects |
| `SODA_COMPANY_EMAIL_DOMAIN` / `NEXT_PUBLIC_SODA_COMPANY_EMAIL_DOMAIN` | Email domain |
| `ALLOW_IN_MEMORY_BUSINESS_CORE` | Dev only; ignored on Vercel production per code comments |
| `BOOTSTRAP_OWNER_*` | CLI bootstrap |
| `SODA_*_SNAPSHOT_OUT` | Backup output paths |

**Controls:** `.gitignore` ignores `.env*`, keeps `.env.example`. Backup tooling documents secret scrubbing. Admin client throws if service role missing.

**Risks:** C1+anon key; H6; scripts that `maskSecret` print masks (names OK). **NOT TESTABLE FROM SOURCE:** whether Vercel Production env is correctly set.

---

## 13. Storage Review

| Bucket | Policies (repo) | Notes |
|--------|-----------------|--------|
| `connect` | SELECT all auth users; write own folder | H2 |
| `soda-files` | Bucket create only | M5 |
| `public/` brand assets | Static public | Expected |

Upload client: mime allowlist (`isAllowedConnectMime`), filename sanitization, no explicit max size in reviewed upload helper (size from browser File — rely on Supabase limits). Backup Mission 08.3 closed with **0 remote objects** at last Founder backup (Master State).

---

## 14. SODA Brain Review

| Check | Result |
|--------|--------|
| Founder-only actions | CONFIRMED — `requireBrainFounder` / `isFounderAccess` |
| Path exposure | `/brain` not in Team `PATH_PREFIXES` — denied by layout |
| ERP auto-write | Design forbids silent ERP; execute after Approve |
| Service-role repo | Bypasses Brain RLS on server — OK only if all callers Founder-gated |
| Team exposure | App path blocked; RLS Founder-only for JWT path |
| Recursion helper | M8 |

**Product note:** Ops Desk Arabic UX and approve/execute loop are strengths; heuristic “AI” not external API — good for privacy.

---

## 15. Team Chat Review

| Topic | Result |
|--------|--------|
| Action gates | `connect.view` / `connect.send` via `canAsync` |
| Roster bootstrap | Admin RPCs to ensure DMs — service_role limited functions |
| Message visibility | RLS membership for SELECT (verify live) |
| Attachments | Meta RLS membership; **blob storage** over-permissive (H2) |
| Edit/delete | App checks sender; DB UPDATE policy H5 |
| Presence | Open SELECT (M6) |
| Profiles directory | H1 PII |
| Realtime | Publication adds; cleanup **NEEDS RUNTIME TEST** |

---

## 16. UX & Product Review

**Strengths**

- Access-aware Home / nav / quick actions / recent-orders copy.
- Forced password change for temps.
- Brain COO flow (parse → approve → execute) matches Founder certainty needs.
- Connect Arabic error strings; soft boot timeouts reduce hang UX (post-42P17 lessons).
- People OS / Authority Center align with “no fake crew”.

**Weaknesses**

- Shell module denial ≠ data protection — Founder cannot safely onboard Team until C1/C2 fixed.
- Finance / statistics may feel ready while DB is open — false confidence.
- Home still operationally heavy for a Command Center (historical card stack patterns may remain).
- Lint noise and client-side domain refresh patterns hurt perceived reliability.
- Optional custom permissions promised by Access model not productized (M4).
- Backup restore explicitly disabled — Founder must know Live DB dump still pending (Master State 08.2).

**Operate company safely?** Not yet for multi-user Production data — app UX leads; data plane lags.

---

## 17. Performance Review

| Topic | Finding |
|--------|---------|
| Boot | `BOOT_BUDGET_MS` 3s — good UX, may soft-fail shell data |
| Domain refresh | Many pages `force-dynamic` + parallel `refresh*` — honest but heavy |
| Connect | `listMessages` N+1 attachment/reaction/receipt queries — scalability Medium risk |
| Client mutate+refresh cascades | Order entry refreshes many repos (L29–35) — janky |
| Pagination | Connect messages limited; domain lists often full-table into memory cache |
| Lint | 11 errors — quality |
| typecheck | PASS |
| npm audit | **Failed** (TLS to registry) — §19 / §22 |

---

## 18. Reliability & Backup Review

From Master Project State (2026-07-15):

| Mission | Status |
|---------|--------|
| 08.0 Backup Center | Foundation shipped; restore disabled |
| 08.1 Source protection | CLOSED |
| 08.2 Database protection | Architecture complete; **live Production dump PENDING** |
| 08.3 Storage protection | CLOSED (0 remote objects at backup) |

**Risks:** No restorable Live DB backup yet; Vercel FS ephemeral for Backup Center zips; dry_validate ≠ SUCCESS (permanent reliability rule). Reliability blockers are operational, not only security.

---

## 19. Items Requiring Authenticated Runtime Testing

1. Confirm Production `SODA_AUTH_STRICT` unset/`1` and logged-out users hard-redirect to `/login`.
2. Confirm Production policies for `clients`/`orders`/… match repo (still `using (true)`?).
3. Confirm `000027` profiles peers hotfix applied (no 42P17 in logs).
4. Supabase Auth: Email signup disabled; only invite/provisioned users.
5. Connect: cross-user message UPDATE and storage SELECT (staging).
6. Team user: UI empty scope vs REST anon dump (should be blocked after C1 fix).
7. Brain `/brain` as Team → redirect home.
8. Realtime subscription cleanup / memory on Connect.
9. Mobile Home / Connect UX pass.
10. `npm audit` on a machine with valid registry TLS.

---

## 20. Recommended Fix Order

1. **P0** — Lock down domain RLS: remove `anon` DML; authenticated policies by ownership/assignment/Founder; revoke excess grants (C1).
2. **P0** — Move all ERP mutations behind Server Actions with Access Level + data-scope (C2); ban Client → domain-db.
3. **P0** — Verify/harden Production `SODA_AUTH_STRICT` (H6); force-ignore `=0` on Production builds.
4. **P1** — Connect storage SELECT + messages UPDATE (H2, H5); narrow profiles peer columns (H1).
5. **P1** — Auth callback allowlist (H3); `handle_new_user` refuse privileged metadata (H4).
6. **P1** — Complete Mission 08.2.1 live DB backup (reliability).
7. **P2** — `is_brain_founder` hardening; bootstrap disablement; soda-files policies; rate limits.
8. **P2** — Reduce Client Component refresh fan-out; Connect query batching.
9. **P3** — Lint cleanup; custom per-user permissions if still required by product.

---

## 21. Production Release Blockers

| Blocker | Severity |
|---------|----------|
| Open anon/authenticated domain RLS (C1) | Critical |
| Ungated client domain mutations (C2) | Critical |
| Verify no `SODA_AUTH_STRICT=0` on Vercel Production (H6) | Critical if present |
| Live Production database dump still missing (Master State) | Reliability / recovery blocker |
| Connect attachment privacy (H2) before real chat files | High once used |

Do **not** mark multi-user Production “safe” until C1/C2 closed and H6 verified.

---

## 22. Audit Limitations

- Read-only source audit; **no** live Supabase catalog query; **no** Production data access; **no** exploitation.
- Production RLS drift vs migrations **NEEDS RUNTIME TEST**.
- `npm audit --json` failed (certificate verification to registry) — dependency CVE status unknown.
- Build not run (prefer typecheck/lint; avoid heavy write caches).
- Browser / mobile UX not interacted on Production.
- Next.js Server Action CSRF defaults assumed from framework (not re-proven).
- Master Project State not modified per mission rules.

---

## Decision

# **STOP AND FIX CRITICAL RISKS**

Continue feature development only with **restrictions**: treat Supabase anon key as hostile; do not trust Access Level for data confidentiality until RLS + Server Action mutation boundaries ship; verify Production auth-strict env; keep Team rollout paused for real business data; prioritize Mission 08.2.1 backup.

**Alternate label if Founder accepts empty/dev-only data and locks signup + confirms strict auth:** `CONTINUE WITH RESTRICTIONS` — still **not** `SAFE TO CONTINUE DEVELOPMENT` unrestricted.

---

## Appendix A — Commands executed

| Command | Result |
|---------|--------|
| `npm run typecheck` | PASS (exit 0) |
| `npm run lint` | FAIL (exit 1) — 11 errors, 6 warnings |
| `npm audit --json` | FAIL — registry TLS / audit endpoint error |

Extensive Grep/Read/Glob of migrations, identity, middleware, actions, Connect, Brain, backup, env example. Explore subagent used for parallel RLS/auth surfaces (read-only).

## Appendix B — Files created

- `docs/audits/SODA_OS_SECURITY_PRODUCT_AUDIT_2026-07-16.md` (this file)

## Appendix C — Integrity statements

- No application source code modified.
- No migrations applied; no Supabase/RLS/env/package changes.
- No commits or pushes.
- No Production business data accessed or modified.
- No secret values printed (variable names only).
