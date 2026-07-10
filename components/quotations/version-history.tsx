"use client";

import { formatShortDate } from "@/lib/quotations/utils";
import type { QuotationVersion } from "@/lib/quotations/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VersionHistoryProps {
  versions: QuotationVersion[];
  currentVersion: number;
  onRestore: (version: number) => void;
  disabled?: boolean;
}

export function VersionHistory({
  versions,
  currentVersion,
  onRestore,
  disabled,
}: VersionHistoryProps) {
  const sorted = [...versions].sort((a, b) => b.version - a.version);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Version history</CardTitle>
        <p className="text-xs text-muted-foreground">
          Current: v{currentVersion}. Restore creates a new version from the
          selected snapshot.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {sorted.map((v) => (
          <div
            key={v.version}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">
                Version {v.version}
                {v.version === currentVersion ? (
                  <span className="ml-2 text-xs font-normal text-soda-pink">
                    current
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {v.editedBy} · {formatShortDate(v.editedAt.slice(0, 10))} ·{" "}
                {v.changeSummary}
              </p>
            </div>
            {v.version !== currentVersion ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7"
                disabled={disabled}
                onClick={() => onRestore(v.version)}
              >
                Restore
              </Button>
            ) : null}
          </div>
        ))}
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No versions yet.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
