import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { statusStyles } from "@/lib/orders/status-styles";
import type { OrderStatus } from "@/lib/orders/types";

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(statusStyles[status], className)}>
      {status}
    </Badge>
  );
}
