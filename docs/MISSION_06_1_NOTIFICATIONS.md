# Mission 06.1 — Human Notification Center

**Production:** https://soda-os.vercel.app  
**Scope:** Experience + lifecycle only. Mission 04.5 permissions/scope unchanged.

## Hybrid storage

| Layer | Role |
|-------|------|
| `business_events` | Source of notification **content** (title/body/href via engine) |
| `public.notifications` | Per-user **lifecycle** (read / acknowledged / completed / archive / dismiss + history) |
| `localStorage` (`soda.ntf.lifecycle.v1:{userId}`) | Optimistic / offline bridge across soft navigations |

Apply additive migration: `supabase/migrations/20260715000023_mission_06_1_notification_lifecycle.sql`

If the table/columns are missing, the UI still works with in-memory + localStorage until Founder runs the SQL.

## Lifecycle

`unread` → `read` (open / mark) → `acknowledged` (Accept/Confirm when required) → `completed` (business closed, reject, dismiss, archive).

Smart sync infers completion from assignment status + related order/invoice events — no forever-stale CrewAssigned / OrderCreated when the ERP already closed them.

## Scope

`loadNotificationsForSession` still scopes via Mission 04.5 data-scope. No fake seeding. Badge = unread only.
