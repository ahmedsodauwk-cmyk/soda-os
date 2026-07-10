import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { projectStatusStyles } from "@/lib/projects/status-styles";
import type { ProjectStatus } from "@/lib/projects/types";

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function ProjectStatusBadge({
  status,
  className,
}: ProjectStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(projectStatusStyles[status], className)}>
      {status === "OnHold" ? "On Hold" : status}
    </Badge>
  );
}
