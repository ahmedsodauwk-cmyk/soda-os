"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applyOrderStatus } from "@/lib/orders/engine";
import {
  CREW_OPERATIONAL_STATUSES,
  type CrewOperationalStatus,
  type Order,
  type OrderStatus,
} from "@/lib/orders/types";

const CREW_LABELS: Record<CrewOperationalStatus, string> = {
  Shooting: "Started",
  Editing: "Shoot completed",
  Completed: "Completed",
  Delivered: "Material delivered",
};

interface OrderStatusControlsProps {
  order: Order;
  /** When true, only crew operational statuses are offered */
  crewOnly?: boolean;
  allowedStatuses?: OrderStatus[];
}

export function OrderStatusControls({
  order,
  crewOnly = false,
  allowedStatuses,
}: OrderStatusControlsProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options: OrderStatus[] = crewOnly
    ? [...CREW_OPERATIONAL_STATUSES]
    : (allowedStatuses ?? [...CREW_OPERATIONAL_STATUSES]);

  async function handleChange(value: string | null) {
    if (!value || value === order.status) return;
    setSaving(true);
    setError(null);
    try {
      await applyOrderStatus(order.id, value as OrderStatus);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Select
        value={order.status}
        onValueChange={handleChange}
        disabled={saving}
      >
        <SelectTrigger className="h-8 w-[11rem]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {options.map((status) => (
            <SelectItem key={status} value={status}>
              {crewOnly
                ? (CREW_LABELS[status as CrewOperationalStatus] ?? status)
                : status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {saving ? (
        <Button type="button" variant="ghost" size="sm" disabled>
          Updating…
        </Button>
      ) : null}
    </div>
  );
}
