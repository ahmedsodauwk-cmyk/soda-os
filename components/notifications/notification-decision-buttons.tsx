"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { useNotificationLiveOptional } from "@/components/notifications/notification-live-store";
import {
  acceptCrewAssignment,
  rejectCrewAssignment,
} from "@/lib/core/notifications/actions";
import type { NotificationAction, NotificationRecord } from "@/lib/core/types";

interface NotificationDecisionButtonsProps {
  notificationId?: string;
  actions?: NotificationAction[];
  onDecided?: (status: "confirmed" | "cancelled") => void;
}

/** Accept / Reject for CrewAssigned — updates lifecycle without full page refresh. */
export function NotificationDecisionButtons({
  notificationId,
  actions,
  onDecided,
}: NotificationDecisionButtonsProps) {
  const live = useNotificationLiveOptional();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<"confirmed" | "cancelled" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accept =
    actions?.find((a) => a.kind === "accept" && a.enabled && a.assignmentId) ??
    actions?.find((a) => a.kind === "confirm" && a.enabled && a.assignmentId);
  const reject =
    actions?.find((a) => a.kind === "reject" && a.enabled && a.assignmentId) ??
    actions?.find((a) => a.kind === "decline" && a.enabled && a.assignmentId);

  if (!accept && !reject) return null;
  if (done) {
    return (
      <p className="font-ar text-xs text-muted-foreground" dir="rtl">
        {done === "confirmed" ? "اتأكد التعيين — شكراً." : "اترفض التعيين."}
      </p>
    );
  }

  function run(kind: "accept" | "reject", assignmentId: string) {
    setError(null);
    startTransition(async () => {
      const result =
        kind === "accept"
          ? await acceptCrewAssignment(assignmentId)
          : await rejectCrewAssignment(assignmentId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const status = result.status === "confirmed" ? "confirmed" : "cancelled";
      setDone(status);
      if (notificationId && live) {
        live.setStatusLocal(
          notificationId,
          status === "confirmed" ? "acknowledged" : "completed",
          {
            acknowledgedAt: new Date().toISOString(),
            completedAt:
              status === "cancelled" ? new Date().toISOString() : undefined,
          }
        );
      }
      onDecided?.(status);
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2" dir="rtl">
      {accept?.assignmentId ? (
        <Button
          type="button"
          size="sm"
          variant="default"
          className="min-h-9 cursor-pointer bg-soda-pink px-3 text-soda-action-foreground hover:bg-soda-pink/90"
          disabled={pending}
          onClick={() => run("accept", accept.assignmentId!)}
        >
          قبول
        </Button>
      ) : null}
      {reject?.assignmentId ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-9 cursor-pointer px-3"
          disabled={pending}
          onClick={() => run("reject", reject.assignmentId!)}
        >
          رفض
        </Button>
      ) : null}
      {error ? (
        <span className="font-ar text-xs text-destructive">{error}</span>
      ) : null}
    </div>
  );
}

export function notificationNeedsDecision(n: NotificationRecord): boolean {
  if (n.status === "acknowledged" || n.status === "completed") return false;
  return Boolean(
    n.actions?.some(
      (a) =>
        (a.kind === "accept" ||
          a.kind === "confirm" ||
          a.kind === "reject" ||
          a.kind === "decline") &&
        a.enabled &&
        a.assignmentId
    )
  );
}
