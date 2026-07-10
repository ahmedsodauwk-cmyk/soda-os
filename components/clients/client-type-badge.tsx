import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { typeStyles } from "@/lib/clients/type-styles";
import { formatClientType } from "@/lib/clients/utils";
import type { ClientType } from "@/lib/clients/types";

interface ClientTypeBadgeProps {
  type: ClientType;
  className?: string;
}

export function ClientTypeBadge({ type, className }: ClientTypeBadgeProps) {
  return (
    <Badge variant="outline" className={cn(typeStyles[type], className)}>
      {formatClientType(type)}
    </Badge>
  );
}
