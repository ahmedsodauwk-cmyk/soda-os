"use client";

import { useState } from "react";
import { CheckCircle2, Flag } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { finishProject, markShootComplete } from "@/lib/integration";
import type { Project, ProjectOrderStub } from "@/lib/projects/types";

interface ProjectWorkflowActionsProps {
  project: Project;
  orders: ProjectOrderStub[];
}

export function ProjectWorkflowActions({
  project,
  orders,
}: ProjectWorkflowActionsProps) {
  const router = useRouter();
  const [orderId, setOrderId] = useState(
    () => orders.find((o) => o.status === "Shooting" || o.status === "Scheduled")?.id ?? orders[0]?.id ?? ""
  );
  const [busy, setBusy] = useState<"shoot" | "finish" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canFinish =
    project.status !== "Completed" && project.journeyStage !== "Closed";

  async function onMarkShootComplete() {
    if (!orderId) return;
    setBusy("shoot");
    setError(null);
    try {
      await markShootComplete(orderId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function onFinishProject() {
    setBusy("finish");
    setError(null);
    try {
      await finishProject(project.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        {orders.length > 0 ? (
          <>
            <Select value={orderId} onValueChange={(v) => v && setOrderId(v)}>
              <SelectTrigger className="h-8 w-[160px]">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                {orders.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!orderId || busy !== null}
              onClick={() => void onMarkShootComplete()}
            >
              <CheckCircle2 className="size-3.5" />
              {busy === "shoot" ? "Updating…" : "Mark shoot complete"}
            </Button>
          </>
        ) : null}
        {canFinish ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={busy !== null}
            onClick={() => void onFinishProject()}
          >
            <Flag className="size-3.5" />
            {busy === "finish" ? "Closing…" : "Project finished"}
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
