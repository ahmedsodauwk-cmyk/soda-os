"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, HardDrive, Loader2 } from "lucide-react";

import { createBackupAction } from "@/lib/backup/actions";
import { formatBytes } from "@/lib/backup/format";
import { BACKUP_CLOUD_PROVIDERS } from "@/lib/backup/providers";
import type {
  BackupDashboardStatus,
  BackupHistoryEntry,
  BackupType,
  HealthStatus,
} from "@/lib/backup/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const BACKUP_TYPE_LABELS: Record<
  BackupType,
  { label: string; available: boolean }
> = {
  manual: { label: "Manual Backup", available: true },
  automatic: { label: "Automatic Backup", available: false },
  scheduled: { label: "Scheduled Backup", available: false },
  cloud: { label: "Cloud Backup", available: false },
};

function statusTone(status: HealthStatus): string {
  switch (status) {
    case "OK":
      return "text-emerald-400";
    case "DEGRADED":
      return "text-amber-400";
    case "UNAVAILABLE":
      return "text-rose-400";
    default:
      return "text-muted-foreground";
  }
}

function Metric({
  label,
  value,
  hint,
  valueClassName,
}: {
  label: string;
  value: string;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/20 px-4 py-3 backdrop-blur-sm">
      <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 font-heading text-lg font-semibold tracking-tight text-foreground",
          valueClassName
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function shortCommit(commit: string): string {
  if (!commit || commit === "unknown") return "—";
  return commit.slice(0, 7);
}

type BackupCenterClientProps = {
  status: BackupDashboardStatus;
  history: BackupHistoryEntry[];
};

export function BackupCenterClient({
  status,
  history,
}: BackupCenterClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [lastDownload, setLastDownload] = useState<string | null>(null);

  function onCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createBackupAction();
      if (!result.ok) {
        setError(result.error ?? "Backup failed.");
        return;
      }
      if (result.downloadPath) {
        setLastDownload(result.downloadPath);
        window.location.assign(result.downloadPath);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {/* Dashboard */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            System Status
          </h2>
          <p className="text-sm text-muted-foreground">
            Live snapshot of backup readiness for SODA OS.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric
            label="System Status"
            value={status.systemStatus}
            valueClassName={statusTone(status.systemStatus)}
          />
          <Metric
            label="Last Backup"
            value={formatWhen(status.lastBackupAt)}
          />
          <Metric
            label="Total Backups"
            value={String(status.totalBackups)}
          />
          <Metric
            label="Backup Size"
            value={formatBytes(status.totalSizeBytes)}
          />
          <Metric
            label="Git Commit"
            value={shortCommit(status.gitCommit)}
            hint={status.gitCommit}
          />
          <Metric
            label="Application Version"
            value={status.applicationVersion}
          />
          <Metric
            label="Last Database Migration"
            value={status.lastDatabaseMigration ?? "—"}
            hint={status.lastDatabaseMigration ?? undefined}
          />
          <Metric
            label="Storage Status"
            value={status.storageStatus}
            valueClassName={statusTone(status.storageStatus)}
          />
          <Metric
            label="Assets Status"
            value={status.assetsStatus}
            valueClassName={statusTone(status.assetsStatus)}
          />
          <Metric
            label="Database Status"
            value={status.databaseStatus}
            valueClassName={statusTone(status.databaseStatus)}
          />
        </div>
        {status.ephemeralStorage ? (
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
            Server filesystem is ephemeral on this host. Download each package
            immediately after create. Persistent cloud destinations are stubs
            only for now.
          </p>
        ) : null}
      </section>

      {/* Backup types */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Backup Types
          </h2>
          <p className="text-sm text-muted-foreground">
            Manual is available now. Other modes are reserved for later missions.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(BACKUP_TYPE_LABELS) as BackupType[]).map((type) => {
            const meta = BACKUP_TYPE_LABELS[type];
            return (
              <div
                key={type}
                className={cn(
                  "rounded-xl border px-4 py-4",
                  meta.available
                    ? "border-soda-pink/35 bg-soda-pink/8"
                    : "border-white/8 bg-black/15 opacity-70"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{meta.label}</p>
                  <Badge variant={meta.available ? "secondary" : "outline"}>
                    {meta.available ? "Ready" : "Future"}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Manual create */}
      <section>
        <Card className="soda-cc-card border-soda-pink/25 bg-gradient-to-br from-black/35 via-soda-purple-deep/20 to-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="size-5 text-soda-pink" />
              Manual Backup
            </CardTitle>
            <CardDescription>
              Generate a complete metadata package with brand copies, migration
              list, and manifest — never secrets.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              size="lg"
              disabled={pending}
              onClick={onCreate}
              className="min-w-[10rem]"
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Backup"
              )}
            </Button>
            {error ? (
              <p className="text-sm text-rose-400">{error}</p>
            ) : lastDownload ? (
              <p className="text-sm text-muted-foreground">
                Package ready — download started.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Each run uses a unique timestamp. Existing backups are never
                overwritten.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* History */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Backup History
          </h2>
          <p className="text-sm text-muted-foreground">
            Newest first. Download keeps a local copy on your device.
          </p>
        </div>
        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/12 px-4 py-10 text-center text-sm text-muted-foreground">
            No backups yet. Create the first Founder package above.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/8">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-black/30 text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Commit</th>
                  <th className="px-4 py-3 font-medium">Version</th>
                  <th className="px-4 py-3 font-medium">Creator</th>
                  <th className="px-4 py-3 font-medium">Download</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-white/6 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatWhen(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">{formatBytes(row.sizeBytes)}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {shortCommit(row.commit)}
                    </td>
                    <td className="px-4 py-3">{row.version}</td>
                    <td className="px-4 py-3">{row.creatorName}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={
                          <a
                            href={`/api/backup/${encodeURIComponent(row.id)}/download`}
                          />
                        }
                      >
                        <Download />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Restore — disabled */}
      <section>
        <Card className="soda-cc-card border-white/8 opacity-80">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Restore</CardTitle>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
            <CardDescription>
              Restore from package is intentionally disabled in Foundation. Do
              not attempt partial restores from Backup Center yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" disabled variant="secondary">
              Restore Backup
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Future cloud stubs */}
      <section className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Cloud Destinations
          </h2>
          <p className="text-sm text-muted-foreground">
            Architecture stubs only — not connected.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BACKUP_CLOUD_PROVIDERS.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-white/8 bg-black/15 px-4 py-4 opacity-65"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{p.label}</p>
                <Badge variant="outline">Soon</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
