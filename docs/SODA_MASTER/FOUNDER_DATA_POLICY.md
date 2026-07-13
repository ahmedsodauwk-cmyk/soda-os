# SODA OS — Founder Data Policy

**Status:** Binding  
**Effective:** 2026-07-13  
**Production:** https://soda-os.vercel.app  

SODA OS is a **real business system**. Production data is sacred.

---

## 1. Business data belongs ONLY to the Founder

Every Client, Order, Project, Crew member, Payment, Invoice, Quotation, File, Partnership, and Finance record in Production exists because the Founder (or an authorized operator acting for the Founder) intentionally recorded it.

Agents, scripts, and automated jobs do **not** own Production data.

---

## 2. The system must NEVER generate business entities automatically

On Production boot, deploy, page load, or background refresh, the system must **not** create:

- Clients
- Orders
- Projects
- Finance / ledger events (except as a direct consequence of a Founder-initiated action)
- Crew / people records
- Partnerships
- Files
- Quotations / invoices / payments
- Any other business entity

Allowed on boot / refresh (non-business / structural):

- Auth session + identity profile bootstrap (user ↔ role only)
- Taxonomy / workspace reference rows required by FKs (`lib/taxonomy/persist.ts`)
- Default cash-account chart rows (`ensureDefaultCashAccounts`) — chart of accounts only, not fake transactions or clients
- In-memory cache hydration from existing Supabase rows (`refresh*`)

---

## 3. No fake clients, orders, projects, finance, or crew

Do not ship or run:

- Demo clients / “Acme” / placeholder companies
- Seed arrays of fake business records
- Smoke leftovers left in Production
- Fixtures that look like real studio work

Empty Production is acceptable. Fake Production is not.

---

## 4. Demo / smoke / seed data ONLY in development

| Environment | Business demo / smoke writes |
|-------------|------------------------------|
| Local / dedicated Dev Supabase | Allowed (create + cleanup) |
| Vercel Preview against non-prod DB | Allowed only if DB is not Production |
| **Production** (`VERCEL_ENV=production` or Production Supabase URL) | **Forbidden** |

Smoke scripts under `scripts/smoke-*.ts` call `assertNonProductionTarget()` and refuse Production.

Emergency override `SODA_ALLOW_PRODUCTION_SMOKE=1` exists only for explicit incident recovery — never for routine testing.

---

## 5. Every Production record must be traceable to a Founder action

Acceptable provenance:

- UI create / edit / delete by a signed-in operator
- Explicit Founder-approved import or migration
- Conversion flows the Founder triggered (e.g. quotation → project)

Unacceptable provenance:

- App boot factories
- Cron / deploy hooks that insert demo rows
- Smoke scripts run against Production
- “Helpful” auto-seed on first visit

---

## 6. Rules for future developers and agents

1. Read this file before touching Production data or smoke scripts.
2. Never delete Founder / real business clients unless the Founder explicitly names them.
3. Prefer empty states over fake data.
4. Keep `lib/*/mock-data.ts` and domain `seed.ts` arrays empty of business records.
5. Taxonomy seed is structural reference data — not clients or orders.
6. Owner bootstrap (`/bootstrap`, `npm run bootstrap:owner`) is **identity-only** — Auth user + profile + role. It must never create fake clients or orders.
7. When in doubt: do not write to Production.

---

## Related

- Production audit notes: `docs/SODA_MASTER/PRODUCTION_AUDIT.md`
- Smoke guard: `scripts/assert-non-production.ts`
- Taxonomy persist (allowed): `lib/taxonomy/persist.ts`
