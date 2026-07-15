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

## Related

- Backup Center (ops packages): Mission 08.0 / `lib/backup`
- Founder data policy: `docs/SODA_MASTER/FOUNDER_DATA_POLICY.md`
