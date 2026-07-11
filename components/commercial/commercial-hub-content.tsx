"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { CommercialLaneCard } from "@/components/commercial/commercial-lane-card";
import { OrderEntryActions } from "@/components/orders/order-entry-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getEmptyState } from "@/lib/brand/soda-voice";
import { refreshOrders } from "@/lib/orders/repository";
import { refreshProjects } from "@/lib/projects/repository";
import {
  filterWorkspaceSummaries,
  getWorkspaceSummaries,
} from "@/lib/workspaces/repository";
import type { WorkspaceSummary } from "@/lib/workspaces/types";

type SortKey = "name" | "projects" | "activity" | "progress";

/** Commercial hub — taxonomy business lanes (RTM, Weddings, Fashion, …). */
export function CommercialHubContent() {
  const [summaries, setSummaries] = useState<WorkspaceSummary[]>(
    getWorkspaceSummaries
  );
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshProjects();
      await refreshOrders();
      if (!cancelled) setSummaries(getWorkspaceSummaries());
    })().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const list = filterWorkspaceSummaries(summaries, search);

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "projects":
          return b.projectCount - a.projectCount;
        case "activity":
          return b.lastActivity.localeCompare(a.lastActivity);
        case "progress":
          return b.progress - a.progress;
        case "name":
        default:
          return a.label.localeCompare(b.label);
      }
    });
  }, [summaries, search, sortBy]);

  return (
    <div className="space-y-6">
      <Card className="transition-colors hover:bg-muted/30">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search commercial lanes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8"
              />
            </div>

            <Select
              value={sortBy}
              onValueChange={(value) => {
                if (value) setSortBy(value as SortKey);
              }}
            >
              <SelectTrigger className="h-8 w-full sm:w-44" size="sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort: Name</SelectItem>
                <SelectItem value="projects">Sort: Projects</SelectItem>
                <SelectItem value="progress">Sort: Progress</SelectItem>
                <SelectItem value="activity">Sort: Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <OrderEntryActions
            defaultProjectType="Commercial"
            triggerLabel="+ New Order"
          />
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">
              {getEmptyState("workspaces").title}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((workspace) => (
            <CommercialLaneCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      )}
    </div>
  );
}
