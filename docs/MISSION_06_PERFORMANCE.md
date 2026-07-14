# Mission 06.0 — Performance Rebirth (Phase 01 Audit + Delivery)

**Production:** https://soda-os.vercel.app  
**Date:** 2026-07-15  
**Scope:** Performance only — no UI redesign, no business-logic / permission changes.

---

## Root causes (pre-fix)

1. **No shared shell layout** — `AppShell` re-composed every page → Sidebar/Header remount + rehydrate on every soft nav (~2–5s feel).
2. **AppShell waterfall** — notifications then permissions sequentially; notifications hydrated on every route.
3. **Middleware + RSC double `getUser`** — auth work paid twice per navigation.
4. **`force-dynamic` + domain fan-out** — Home / Brain ERP blocked on large refreshes before first paint.
5. **Zero Suspense / skeletons / `dynamic()`** on key routes — blank or fully-blocking waits.
6. **Ops Desk typing lag** — controlled textarea in a mega parent; idle debounce called full `ingest` (cleared text + server parse); debounce was **1500ms**.
7. **Brain waterfalls** — `listBrainEntries` then full dashboard via ERP panel; Ops parse pulled full `brain_entries` repeatedly.
8. **Raw `<img>` for brand** — no `next/image`.

---

## What shipped

| Phase | Status | Notes |
|-------|--------|-------|
| 01 Audit | Done | This document |
| 02 Prefetch | Done | Sidebar `Link prefetch`; soft nav only |
| 03 Shared layout | Done | `app/(shell)/layout.tsx` — chrome persists |
| 04 Session cache | Done | Layout-level session; `cache()` on permissions + notifications |
| 05 Query opt | Done | Parallel shell fetches; Brain entries cache; Brain ERP deferred |
| 06 Dashboard stream | Done | Founder Home Suspense + greeting-first fallback |
| 07 Skeletons | Done | `soda-skeleton` + route `loading.tsx` |
| 08 Lazy | Done | Understanding panels, recharts financial card |
| 09 React | Done | Isolated Ops composer; no blind memo |
| 10 Bundle | Partial | Recharts deferred; no full analyzer run in CI |
| 11 Images | Done | `SodaLogo` → `next/image`, priority sidebar/login only |
| 12 DB indexes | Documented | Additive SQL migration for Founder apply |
| 13 Brain typing | Done | Uncontrolled composer; **500ms** idle; client parse; no clear on idle |
| 14 Background | Done | Chat hydrate / idle ERP enrich after paint |
| 15 Mobile | Audited | Existing overflow/safe-area kept; shell remount was main pain |

---

## Files changed (high signal)

- `app/(shell)/layout.tsx` — persistent shell
- `app/(shell)/**` — moved authenticated routes into route group
- `components/layout/app-shell.tsx` — thin page meta
- `components/layout/shell-*.tsx` — provider + frame
- `components/brain/operations-desk.tsx` + `ops-desk-composer.tsx`
- `app/(shell)/page.tsx` + `founder-home-stream.tsx`
- `lib/identity/permission-service.ts`, `lib/core/notifications/load.ts`, `lib/brain/repository.ts`
- `components/ui/soda-skeleton.tsx`, route `loading.tsx` files
- `components/brand/soda-logo.tsx`
- `supabase/migrations/20260715000022_mission_06_hot_indexes.sql`

---

## Before vs After (honest)

| Metric | Before | After | How measured |
|--------|--------|-------|--------------|
| Soft nav feel | ~2–5s full rehydrate | Shell stays mounted; content swap + skeletons | Architecture + qualitative; Lighthouse nav not A/B'd in CI |
| Ops Desk typing | Parent re-render every key; idle cleared input @ 1500ms | Uncontrolled input; idle client parse @ **500ms**; server enrich background | Code path + local interaction |
| Home first paint | Blocked on full dashboard snapshot | Greeting + skeleton stream, then widgets | Suspense boundaries |
| Duped shell queries | Notifications then permissions serial | `Promise.all` + React `cache()` | Code review |
| Bundle (recharts) | Eager on Home | `dynamic()` after paint | Code; no webpack analyzer artifact attached |

**Not fully verified in this pass:** Production Lighthouse scores, Network waterfalls on Vercel edge, live Supabase `EXPLAIN`. Prefer Founder DevTools after deploy.

---

## Production verification checklist

1. Soft-navigate Home → Orders → Clients → People → Brain — Sidebar/Header should not flash remount.
2. Ops Desk: type continuously — cursor stable, no wipe on pause; panel updates ~500ms after idle; Enter sends; Shift+Enter newline.
3. Home: brief skeleton/greeting then widgets fill.
4. Apply `20260715000022_mission_06_hot_indexes.sql` in Supabase if Production missing any listed indexes.
