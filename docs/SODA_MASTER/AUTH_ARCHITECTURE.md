# SODA VISUALS — Authentication & Identity Architecture

**Status:** Foundation prepared (Brand Identity & Auth mission)  
**Production:** https://soda-os.vercel.app  

**CRITICAL:** Do NOT create demo/seed Auth users or invent crew names.  
Ask the Founder for the official crew list before provisioning accounts.

Related: `docs/SODA_MASTER/FOUNDER_DATA_POLICY.md`

---

## Brand

- Official company name: **SODA VISUALS**
- Never use: SODA Studio, Studio (as company branding)
- Company email default domain: `sodavisuals.com` (configurable)

---

## Identity model

```
auth.users (Supabase Auth)
    │ 1:1
    ▼
public.profiles
    │ optional person_id
    ▼
public.people          ← crew / HR record (wallet, assignments, performance)
```

| Layer | Table | Purpose |
|-------|--------|---------|
| Auth | `auth.users` | Credentials, session, email |
| Profile | `public.profiles` | Role, username, `must_change_password`, link to people |
| Person | `public.people` | Operational crew record (orders, calendar, files, wallet) |
| RBAC | `roles` / `permissions` / `role_permissions` | Founder-assignable permissions (DB SoT) |
| Config | `app_settings` | `company_email_domain`, display name |

### Extension points (no rewrite required later)

| Future surface | Hook |
|----------------|------|
| Profile | `profiles` + `/me` / settings |
| Wallet / bonus / penalties | `people` ↔ `profiles.person_id` + `me.*` permissions |
| Notifications | `notifications.user_id` → `auth.users` |
| Internal chat | Message rows keyed by `user_id` / `person_id` |
| Order assignment | `order_assignments.person_id` → `people` |
| Calendar | Existing calendar + `person_id` filters |
| Performance | `me.performance` + people metrics |
| Files | `me.files` + storage scoped by user/person |

---

## People OS (Mission 04.4)

- Directory: `/people` — personal workspaces, not a flat Users table
- Profile workspace: `/people/[id]/…` (overview, orders, wallet, …)
- Legacy `/crew` redirects to `/people`
- Profile fields on `public.people` (display_name, department, emergency contact)
- Operational roles additive in `public.roles` (Founder, Project Manager, craft roles, …)
- **Authority Center:** `/settings/authority` — manage existing accounts, disable/archive, reset password, change role, customize `role_permissions` by permission group
- **Crew Workspace Account:** `/people/[id]` — Create Login Account (Founder only), identity link status, disable/enable, reset password
- Legacy `/settings/permissions` redirects to Authority Center
- Accounts created **only** from Crew Workspace (Founder/Admin) — one per crew member; no demo/seed Auth users

---

## Login

- Accept **username** OR **email**
- Resolver: `public.resolve_login_email(identifier)` + `lib/auth/resolve-login.ts`
- Username maps to `profiles.username`, else `username@{company_email_domain}`
- Domain from `app_settings.company_email_domain` (Settings-changeable); env `SODA_COMPANY_EMAIL_DOMAIN` is fallback only

---

## Temporary passwords

1. `generateTemporaryPassword()` in `lib/auth/temp-password.ts`
2. Create user with metadata `must_change_password: true`
3. `profiles.must_change_password = true`
4. `AppShell` redirects to `/settings/password` until cleared
5. `changePasswordAction` + `clear_must_change_password()` clears the flag
6. Credentials shown **once** in Crew Workspace after Create / Reset — never stored again

---

## Permissions

- **Long-term SoT:** DB `role_permissions` (Founder assigns via Authority Center)
- **Service:** `lib/identity/permission-service.ts` (`canAsync`, assign/revoke)
- **Action-based keys:** create/approve/delete order, expenses.create, payments.approve, work.assign, content.publish, *.manage
- **Groups:** Orders, Finance, Crew, Clients, Projects, Calendar, Reports, Notifications, Commercial, Settings, Social Media
- **Nav / Home / Quick Actions:** filter via permission set (`navForPermissions`, `homePathForPermissions`)
- **Deprecated fallback:** hardcoded maps in `lib/identity/permissions.ts` (`can()`)

---

## Provisioning policy

1. Founder supplies **official crew list** (names, usernames, roles)
2. Crew Workspace **Create Login Account** creates exactly those Auth users — no demos, no invented names
3. Authority Center manages existing accounts only — not provisioning
3. Owner bootstrap (`/bootstrap`) is identity-only and already exists; do not re-seed

---

## STOP

Do not invent crew names. Do not create Auth users except when the Founder explicitly provisions via Crew Workspace.
