import { Badge } from "@/components/ui/badge";
import type { EquipmentAssignment, EquipmentItem } from "@/lib/equipment/types";

type Row = EquipmentItem & { assignment: EquipmentAssignment };

interface EquipmentListProps {
  items: Row[];
  emptyLabel?: string;
  showHistory?: boolean;
}

export function EquipmentList({
  items,
  emptyLabel = "No equipment assigned.",
  showHistory = false,
}: EquipmentListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
      {items.map((item) => (
        <li
          key={`${item.id}-${item.assignment.id}`}
          className="flex items-start justify-between gap-3 px-3.5 py-3"
        >
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.type}
              {item.serialNumber ? ` · ${item.serialNumber}` : ""}
            </p>
            {showHistory ? (
              <p className="text-xs text-muted-foreground">
                {item.assignment.assignedAt}
                {item.assignment.returnedAt
                  ? ` → ${item.assignment.returnedAt}`
                  : " · current"}
                {item.assignment.note ? ` · ${item.assignment.note}` : ""}
              </p>
            ) : item.assignment.note ? (
              <p className="text-xs text-muted-foreground">
                {item.assignment.note}
              </p>
            ) : null}
          </div>
          <Badge variant="outline" className="shrink-0 capitalize">
            {item.assignment.returnedAt ? "returned" : item.status}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
