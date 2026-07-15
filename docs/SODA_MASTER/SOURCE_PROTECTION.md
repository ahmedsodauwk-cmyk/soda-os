# Source Code Protection — Mission 08.1

**Owner:** Founder  
**Rule:** GitHub is a remote mirror, not the only copy. The Founder PC is the **Primary Recovery Device**.

This document defines local ownership of SODA OS source and the **Create Source Snapshot** command. It does not export secrets, `.env` values, or tokens.

---

## Founder PC — local folder structure

On the Founder machine, keep a fixed recovery tree at:

```
D:\SODA OS\
  Source          Working / recovered source tree (clone or unpack)
  Backups         Operational backup packages (Backup Center / ops)
  Database        DB dumps / schema exports (never secrets inline)
  Storage         File / object storage mirrors (as needed)
  Assets          Media and production assets
  Brand           Official brand kit copies
  Documentation   Founder docs and runbooks
  Exports         One-off exports and transfer packs
  Restore         Staging area for restore drills
  Versions        Dated source snapshots (SODA_Source_*.zip)
```

### Notes

- These folders live on the Founder PC under `D:\SODA OS\`. They are **not** required on every build machine.
- To create the tree when `D:\` is available, run:

  ```bash
  npm run founder:local-dirs
  ```

  Or manually create the directories listed above.

- Snapshots prefer writing to `D:\SODA OS\Versions` when that path exists; otherwise they fall back to project `Exports/` (or `SODA_SOURCE_SNAPSHOT_OUT` / `--out`).

---

## Create Source Snapshot

**Founder command:** Create Source Snapshot  
**npm scripts:**

```bash
npm run backup:source
# alias:
npm run soda:source-snapshot
```

**CLI:** `npx tsx scripts/create-source-snapshot.ts [--out <dir>]`

### What it does

1. Walks the project tree and collects **complete source**
2. **Excludes:** `node_modules`, `.next`, caches, build/temp folders, `.env*` and other secrets, prior snapshot zips
3. Writes `SODA_Source_<version>_<date>.zip`
4. Embeds metadata at the archive root:
   - `manifest.json`
   - `VERSION.txt`
   - `GIT_COMMIT.txt`
   - `GIT_BRANCH.txt`
   - `BUILD_DATE.txt`

### `manifest.json` fields

| Field | Meaning |
|--------|---------|
| `product` | SODA OS |
| `version` | `package.json` version |
| `commit` | Git commit SHA |
| `branch` | Current branch |
| `createdAt` | ISO timestamp |
| `totalFiles` | Files packaged (source + metadata) |
| `projectSize` | Total bytes of packaged file contents |
| `outputFile` | Snapshot filename |
| `exclusions` | Summary of exclude rules |

### Output location (priority)

1. `--out <dir>` or `SODA_SOURCE_SNAPSHOT_OUT`
2. `D:\SODA OS\Versions` (if present)
3. `D:\SODA OS\Exports` (if Versions missing but Exports present)
4. `<repo>/Exports/`

Place verified snapshots under **Versions** (preferred) or **Exports** on the Founder PC per the tree above.

### Safety

- Never packages `.env`, `.env.*`, PEM keys, or credential files
- Does not push anything to remotes
- Does not modify ERP / Brain / Connect / Database product code

---

## Recovery sketch

1. Copy a `SODA_Source_*.zip` from `D:\SODA OS\Versions` (or Exports)
2. Unpack into `D:\SODA OS\Source` (or a dated folder under Restore)
3. Install deps: `npm install`
4. Configure env locally from Founder-held secrets (never from the zip)
5. Restore Database / Storage from their sibling folders as needed

---

## Database Protection — Mission 08.2

**Founder command:** Enterprise Database Snapshot  
**npm scripts:**

```bash
npm run backup:database
# alias:
npm run soda:database-snapshot
```

**CLI:** `npx tsx scripts/create-database-snapshot.ts [--out <dir>] [--dry-validate]`

### What it does

1. Loads connection settings from `.env.local` / process env (**never logs full secrets**)
2. Prefers **`pg_dump`** when `DATABASE_URL` / `SUPABASE_DB_URL` / `DIRECT_URL` / `POSTGRES_URL` is set, or when `SUPABASE_DB_PASSWORD` + project URL can build a connection string
3. If `pg_dump` is missing but Postgres is reachable: **`pg` client** reconstructs schema SQL (tables, extensions, functions, policies, triggers, indexes) + row `INSERT` data
4. If no direct Postgres: **service-role REST** dumps recoverable table JSON (OpenAPI / known tables). Documents that policies/triggers/functions/indexes are incomplete in this mode. **Service role key is never written into the zip**
5. Always copies `supabase/migrations/*.sql` + `applied_migrations.json`
6. Writes `SODA_Database_<date>.zip` with embedded `manifest.json`
7. **Immediately validates:** zip readable, manifest valid, SQL valid, integrity valid. Validation failure → `backupStatus: FAILED` (never SUCCESS)

### `manifest.json` fields

| Field | Meaning |
|--------|---------|
| `databaseVersion` | Postgres version string (or unavailable / mode note) |
| `migrationCount` | Count of migration SQL files packaged |
| `tableCount` | Tables recovered in this mode |
| `functionCount` | Functions recovered (0 in service_role / dry) |
| `policyCount` | RLS policies recovered |
| `triggerCount` | Triggers recovered |
| `viewCount` | Views recovered |
| `backupSize` | Zip byte size |
| `checksum` | SHA-256 of packaged payload entries (`sha256:…`) |
| `createdAt` | ISO timestamp |
| `gitCommit` | Git SHA |
| `applicationVersion` | `package.json` version |
| `backupStatus` | `SUCCESS` \| `FAILED` |
| `mode` | `pg_dump` \| `pg_client` \| `service_role` \| `dry_validate` |
| `limitations` | Human-readable gaps for this run |

### Output location (priority)

1. `--out <dir>` or `SODA_DATABASE_SNAPSHOT_OUT`
2. `D:\SODA OS\Database` (if present)
3. `D:\SODA OS\Exports\Database` (if Exports present)
4. `<repo>/Exports/Database/`

Sibling file: `SODA_Database_<date>.manifest.json` (quick inspect without unzipping).

### Dry validation

When no DB credentials are available, the script auto-runs **`dry_validate`**: packages migrations, exercises zip/manifest/SQL/integrity checks, and states limitations clearly. Use `--dry-validate` to force this path.

### Safety

- Never packages `.env`, service-role keys, or connection strings
- Does not change ERP / Team Chat / Identity / Notifications product UI
- Scripts + docs only for this mission

---

## Storage Protection — Mission 08.3

**Founder command:** Enterprise Storage Snapshot  
**npm scripts:**

```bash
npm run backup:storage
# alias:
npm run soda:storage-snapshot
```

**CLI:** `npx tsx scripts/create-storage-snapshot.ts [--out <dir>] [--dry-validate]`

### What it does

1. Loads Supabase settings from `.env.local` / process env (**never logs full secrets**)
2. Prefers **service role** (`SUPABASE_SERVICE_ROLE_KEY`) to `listBuckets` + recursive object list/download for every reachable bucket
3. Falls back to **anon** key when service role is missing (public / policy-permitted objects only)
4. Always packages local **`public/`** tree (brand logos, icons, web assets) and storage metadata JSON
5. Writes `SODA_Storage_<date>.zip` with embedded `manifest.json`
6. **Immediately validates:** every packaged file readable, manifest exists/valid, folder structure valid, integrity valid. Any failure → `backupStatus: FAILED` (never SUCCESS)
7. **Hard stop:** never writes API keys, service-role credentials, or `.env` into the zip (keys used only to fetch)

### `manifest.json` fields

| Field | Meaning |
|--------|---------|
| `bucketCount` | Supabase buckets discovered this run |
| `objectCount` | Objects packaged (remote downloads + local public files) |
| `folderCount` | Unique folder prefixes in the archive |
| `storageSize` | Total bytes of packaged asset/object payloads |
| `checksum` | SHA-256 of packaged payload entries (`sha256:…`) |
| `createdAt` | ISO timestamp |
| `gitCommit` | Git SHA |
| `applicationVersion` | `package.json` version |
| `backupStatus` | `SUCCESS` \| `FAILED` |
| `mode` | `service_role` \| `anon` \| `dry_validate` |
| `limitations` | Human-readable gaps for this run |

### Output location (priority)

1. `--out <dir>` or `SODA_STORAGE_SNAPSHOT_OUT`
2. `D:\SODA OS\Storage` (if present)
3. `D:\SODA OS\Exports\Storage` (if Exports present)
4. `<repo>/Exports/Storage/`

Sibling file: `SODA_Storage_<date>.manifest.json` (quick inspect without unzipping).

### Dry validation

When no Storage API credentials are available, the script auto-runs **`dry_validate`**: packages local `public/` assets, exercises zip/manifest/folder/integrity checks, and states limitations clearly. Use `--dry-validate` to force this path.

### Safety

- Never packages `.env`, service-role keys, anon JWTs, or connection strings
- Does not change ERP / Orders / Team Chat / Identity / Notifications product code or UI
- Scripts + docs (+ architecture stubs) only for this mission

### Future-ready (interfaces only — not implemented)

Documented in `lib/backup/storage-protection-stubs.ts`:

| Stub | Intent |
|------|--------|
| `IncrementalStorageBackupPlan` | Diff by etag / `updated_at` against a prior manifest |
| `CloudReplicationPlan` | Mirror a validated package to external object storage (credential-free config refs) |
| `MultiBucketBackupPlan` | Explicit include/exclude list for large multi-bucket tenants |

Do not implement these flows until a later mission.

---

## Related

- Backup Center (ops packages): Mission 08.0 / `lib/backup`
- Founder data policy: `docs/SODA_MASTER/FOUNDER_DATA_POLICY.md`
