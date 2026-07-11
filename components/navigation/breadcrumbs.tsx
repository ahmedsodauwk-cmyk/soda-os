import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { crumbsForPath, type Crumb } from "@/lib/identity/navigation";
import { cn } from "@/lib/utils";

interface BreadcrumbsProps {
  pathname: string;
  extra?: Crumb[];
  className?: string;
}

export function Breadcrumbs({ pathname, extra, className }: BreadcrumbsProps) {
  const crumbs = extra ?? crumbsForPath(pathname);
  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("mb-4 flex flex-wrap items-center gap-1 text-sm", className)}
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={`${crumb.label}-${i}`} className="flex items-center gap-1">
            {i > 0 ? (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            ) : null}
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className={isLast ? "text-foreground" : "text-muted-foreground"}>
                {crumb.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
