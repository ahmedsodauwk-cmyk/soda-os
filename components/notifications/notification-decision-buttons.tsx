"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  confirmCrewAssignment,
  declineCrewAssignment,
} from "@/lib/core/notifications/actions";
import type { NotificationAction } from "@/lib/core/types";

interface NotificationDecisionButtonsProps {
  actions?: NotificationAction[];
}

/** Confirm / Decline for CrewAssigned — only when actions are enabled. */
export function NotificationDecisionButtons({
  actions,
}: NotificationDecisionButtonsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<"confirmed" | "cancelled" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirm = actions?.find(
    (a) => a.kind === "confirm" && a.enabled && a.assignmentId
  );
  const decline = actions?.find(
    (a) => a.kind === "decline" && a.enabled && a.assignmentId
  );

  if (!confirm && !decline) return null;
  if (done) {
    return (
      <p className="font-ar text-xs text-muted-foreground" dir="rtl">
        {done === "confirmed" ? "اتأكد التعيين." : "اترفض التعيين."}
      </p>
    );
  }

  function run(
    kind: "confirm" | "decline",
    assignmentId: string
  ) {
    setError(null);
    startTransition(async () => {
      const result =
        kind === "confirm"
          ? await confirmCrewAssignment(assignmentId)
          : await declineCrewAssignment(assignmentId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(result.status === "confirmed" ? "confirmed" : "cancelled");
      router.refresh();
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2" dir="rtl">
      {confirm?.assignmentId ? (
        <Button
          type="button"
          size="sm"
          variant="default"
          className="cursor-pointer bg-soda-pink text-soda-action-foreground hover:bg-soda-pink/90"
          disabled={pending}
          onClick={() => run("confirm", confirm.assignmentId!)}
        >
          تأكيد
        </Button>
      ) : null}
      {decline?.assignmentId ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="cursor-pointer"
          disabled={pending}
          onClick={() => run("decline", decline.assignmentId!)}
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
