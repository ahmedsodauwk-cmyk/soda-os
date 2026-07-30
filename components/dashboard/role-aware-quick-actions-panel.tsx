import Link from "next/link";
import {
  Calendar,
  ClipboardList,
  FileText,
  UsersRound,
} from "lucide-react";

import { SodaSectionHeader } from "@/components/brand/soda-section-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import type { AccessLevel } from "@/lib/identity/access-levels";
import type { Permission } from "@/lib/identity/permissions";
import { setHasAny } from "@/lib/identity/permissions";

type ActionDef = {
  label: string;
  href: string;
  icon: typeof FileText;
  anyOf: Permission[];
};

const ACTIONS: ActionDef[] = [
  {
    label: "New Quotation",
    href: "/quotations/new",
    icon: FileText,
    anyOf: ["quotations.edit", "quotations.view"],
  },
  {
    label: "Crew",
    href: "/people",
    icon: UsersRound,
    anyOf: ["people.view", "crew.view", "crew.manage"],
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: Calendar,
    anyOf: ["calendar.view", "calendar.manage"],
  },
  {
    label: "My Orders",
    href: "/orders",
    icon: ClipboardList,
    anyOf: ["orders.view"],
  },
];

function visibleActions(
  allowed: readonly string[],
  accessLevel: AccessLevel
): ActionDef[] {
  return ACTIONS.filter((action) => {
    if (!setHasAny(allowed, action.anyOf)) return false;
    if (accessLevel === "team_leader") {
      return (
        action.href === "/people" ||
        action.href === "/calendar" ||
        action.href === "/orders"
      );
    }
    if (accessLevel === "team") {
      return action.href === "/orders" || action.href === "/calendar";
    }
    if (accessLevel === "account_manager") {
      return action.href !== "/people" || setHasAny(allowed, ["crew.view"]);
    }
    return false;
  });
}

type RoleAwareQuickActionsPanelProps = {
  allowedPermissions?: readonly string[];
  accessLevel: AccessLevel;
};

/** Permission-gated quick actions in Founder V3 panel chrome. */
export function RoleAwareQuickActionsPanel({
  allowedPermissions,
  accessLevel,
}: RoleAwareQuickActionsPanelProps) {
  const granted = allowedPermissions ?? [];
  const actions = visibleActions(granted, accessLevel);

  return (
    <Card className="soda-founder-panel soda-cc-card h-full min-w-0">
      <CardHeader className="px-3 py-2.5 pb-1.5">
        <SodaSectionHeader
          title="Quick Actions"
          layer="quickActions"
          as="h2"
          size="card"
        />
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-2.5 pt-0">
        {actions.length === 0 ? (
          <p className="rounded-lg border border-border/50 bg-muted/20 px-3 py-4 text-center text-sm text-muted-foreground">
            No quick actions available for your permissions.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.href + action.label}
                  size="sm"
                  variant={action.label === "New Quotation" ? "default" : "outline"}
                  className="h-9 w-full justify-start gap-2 text-[15px] font-semibold"
                  nativeButton={false}
                  render={<Link href={action.href} />}
                >
                  <Icon className="size-4" aria-hidden />
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
