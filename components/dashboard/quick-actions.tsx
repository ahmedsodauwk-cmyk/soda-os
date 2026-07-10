import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  FolderPlus,
  Plus,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const actions = [
  {
    label: "New Order",
    href: "/orders",
    icon: Plus,
    enabled: true,
  },
  {
    label: "New Client",
    href: "/clients",
    icon: UserPlus,
    enabled: true,
  },
  {
    label: "New Project",
    href: "/workspaces",
    icon: FolderPlus,
    enabled: true,
  },
  {
    label: "Open Calendar",
    href: "#",
    icon: CalendarDays,
    enabled: false,
    soon: true,
  },
  {
    label: "View Reports",
    href: "#",
    icon: BarChart3,
    enabled: false,
    soon: true,
  },
] as const;

export default function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Jump into daily studio workflows</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {actions.map((action) => {
            const Icon = action.icon;
            const className = cn(
              "h-auto flex-col gap-2 py-4",
              !action.enabled && "opacity-60"
            );

            if (!action.enabled) {
              return (
                <Button
                  key={action.label}
                  variant="outline"
                  disabled
                  className={className}
                >
                  <Icon className="size-4" />
                  <span className="text-xs font-medium">{action.label}</span>
                  <span className="text-[10px] text-muted-foreground">Soon</span>
                </Button>
              );
            }

            return (
              <Button
                key={action.label}
                variant="outline"
                className={className}
                nativeButton={false}
                render={<Link href={action.href} />}
              >
                <Icon className="size-4" />
                <span className="text-xs font-medium">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
