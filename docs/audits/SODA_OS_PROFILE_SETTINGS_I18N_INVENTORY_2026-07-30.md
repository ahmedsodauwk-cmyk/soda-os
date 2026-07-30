# SODA OS — Profile, Settings, i18n Inventory

**Date:** 2026-07-30  
**Mission:** Unified My Profile, Account Security, My Scope, User Preferences, Client Privacy, Complete Arabic Localization  
**Branch:** `feature/unified-profile-settings-i18n`  
**Status:** Inventory + Phase 1 implementation (Founder review)

---

## Executive summary

| Area | Before | Canonical after mission |
|------|--------|-------------------------|
| Settings | Single `/settings` page mixing personal + admin | Hub: Profile, Account, Scope, Preferences + System (admin) |
| Profile photo | URL on `people.avatar_url`, Founder edit only | Self-edit on `/settings/profile` (URL); upload scaffold deferred |
| Language | `soda-locale` cookie + `soda-visuals:locale` localStorage | Same keys — `/settings/preferences` |
| Theme | `soda-theme` cookie + `soda-visuals:theme` | Same — `/settings/preferences` |
| Client privacy | RLS scoped; UI still linked to `/clients/[id]` | Founder-only directory; order whitelist |
| Team settings | No `settings.view` — only `/settings/password` | `settings.personal` — full personal hub |

---

## 1. Identity & profile fields

| Field | Source of truth | Editable where | Duplicates / notes |
|-------|-----------------|----------------|-------------------|
| Username | `profiles.username` + Auth | Authority Center / Crew provisioning | Login form accepts username OR email |
| Email | `auth.users.email` | Authority Center (admin) | Settings display read-only |
| Phone | `people.phone` (ops) / Auth phone if configured | Founder Crew Workspace edit | Not self-service |
| Display name | `people.display_name` → session | `/settings/profile` (self), Founder crew edit | `profiles.full_name` fallback |
| Avatar | `people.avatar_url` | `/settings/profile` (self URL), Founder crew edit | Initials from session |
| Job title | `people.job_title` | Founder only (read-only on self profile) | Distinct from `profiles.role` |
| Access level | `profiles.access_level` | Authority Center | Never job title |
| Role (job) | `profiles.role` | Authority Center | Display only on scope page |
| Permissions | `role_permissions` DB | Authority Center | Sync fallback in `access-levels.ts` |
| `must_change_password` | `profiles.must_change_password` | `/settings/password` | Forced redirect in shell layout |

---

## 2. Settings surfaces (before)

| Route | Contents | Owner |
|-------|----------|-------|
| `/settings` | Profile card, language, theme, admin cards | Mixed |
| `/settings/password` | Change password | Auth |
| `/settings/authority` | Authority Center | `settings.users` |
| `/settings/backup` | Founder backup | Founder |
| `/settings/permissions` | Redirect → authority | Legacy |

| `/people/[id]` | Full crew workspace | Founder edit; Team needs `people.view` |
| `/me` | My Space hub | Nav filtered |

**Duplicates identified:** Language + theme on monolithic `/settings` and sidebar language switcher. Profile photo guidance pointed to `/people/[id]`.

---

## 3. Canonical information architecture (after)

| Section | Route | Data owner | Who |
|---------|-------|------------|-----|
| A. My Profile | `/settings/profile` | `people` (linked person) | All signed-in |
| B. Account & Security | `/settings/account` | Auth (`auth.users`) | All signed-in |
| C. My Scope | `/settings/scope` | `profiles` + `role_permissions` | Read-only all |
| D. My Preferences | `/settings/preferences` | Device cookies/localStorage | All signed-in |
| E. System Settings | `/settings/system` | `app_settings`, Authority | `settings.users` / Founder |
| Password | `/settings/password` | Auth | All (forced if temp password) |

`/settings` → redirects to `/settings/profile`.

---

## 4. User preferences — storage keys

| Preference | Cookie | localStorage | Canonical editor |
|------------|--------|--------------|------------------|
| Language EN/AR | `soda-locale` | `soda-visuals:locale` | `/settings/preferences` |
| Theme | `soda-theme` | `soda-visuals:theme` | `/settings/preferences` |
| Reduced motion | `soda-reduced-motion` | `soda-visuals:reduced-motion` | `/settings/preferences` |
| Sidebar collapsed | — | `soda-sidebar-collapsed` | Sidebar only |
| My workspace open | — | `soda-my-workspace-open` | Sidebar only |

**Removed duplication:** Language/theme removed from monolithic settings (moved to preferences).

---

## 5. Client privacy

| Surface | Non-Founder (mission) | Implementation |
|---------|----------------------|----------------|
| Clients nav | Hidden | `nav.ts` founder-only `/clients`; removed from AM/TL nav matrix |
| `/clients/*` routes | Blocked | `module-access.ts`, `clients/layout.tsx` |
| Order detail client link | No profile link | `canLinkToClientProfile` founder-only |
| Client object to client | Whitelist only | `lib/clients/privacy.ts` |
| RLS `clients` SELECT | Team/TL: none | Migration `20260730000035` (not applied to Prod) |
| Founder | Full access | Preserved |

**Order whitelist fields:** `displayName`, `projectType`, `segmentLabel`, `shootDate`, `location`, `whatsapp` (from order snapshot).

---

## 6. i18n / RTL

| Item | Status |
|------|--------|
| Dictionaries EN + AR | `lib/i18n/dictionaries.ts` |
| `settings.*` keys | Added mission 2026-07-30 |
| Login labels | Partial i18n (`settings.usernameOrEmail`) |
| `lang` / `dir` on `<html>` | `LocaleProvider` |
| Operational nav (`operationalT`) | English-only by design |
| Business data (client names, etc.) | Never auto-translated |

**Gap:** Full route-level i18n for Home, Order Details, all settings cards — PENDING REVIEW (keys exist; many server pages still English hardcoded).

---

## 7. Auth / login

| Feature | Location | Status |
|---------|----------|--------|
| Username OR email login | `resolveLoginEmail`, login form | Working |
| Password change | `/settings/password` | Working |
| Forgot password (email) | `/forgot-password` | Working (email) |
| Phone recovery | — | BLOCKED — no SMS config evidence |
| 2FA | Account page | Placeholder only |
| Temp password flow | `must_change_password` | Working |

---

## 8. Avatar / profile photo

| Capability | Status |
|------------|--------|
| Display URL / initials | Working |
| Self URL edit | `/settings/profile` |
| Upload / crop / storage | DEFERRED — no production storage bucket mission |
| MIME/size validation | URL length + https/http check |
| DB column | `people.avatar_url` (existing) |

---

## 9. Working vs placeholder

| Item | Status |
|------|--------|
| My Profile self-edit | Working (URL + display name) |
| Account email edit in UI | Placeholder (read-only) |
| 2FA | Placeholder |
| Notification type prefs | Link to `/notifications` only |
| Phone SMS recovery | Not implemented |
| Avatar upload | Placeholder (URL only) |
| AM client directory | Removed (Founder-only per mission) |

---

## 10. Files touched (implementation)

- `app/(shell)/settings/**` — IA routes
- `components/settings/**` — hub nav, profile editor
- `lib/clients/privacy.ts` — whitelist
- `lib/identity/module-access.ts` — routes
- `lib/identity/nav.ts` — clients nav
- `lib/identity/access-levels.ts` — `settings.personal`
- `lib/i18n/dictionaries.ts` — settings keys
- `supabase/migrations/20260730000035_*` — RLS scaffold + rollback

---

## 11. Canonical location summary

| Setting | One editor |
|---------|------------|
| Display name / avatar URL | `/settings/profile` |
| Email / username | Display `/settings/account`; change via Authority |
| Password | `/settings/password` |
| Access / permissions | Read `/settings/scope`; edit Authority Center |
| Language / theme / motion | `/settings/preferences` |
| Company domain / invites | `/settings/system` |
| Client records | Founder `/clients` only |

---

*End of inventory — update when Founder approves or defers items.*
