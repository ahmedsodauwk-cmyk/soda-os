import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const orders = [
  {
    client: "Ahmed Ali",
    type: "Wedding",
    status: "Editing",
  },
  {
    client: "Sara Mohamed",
    type: "Engagement",
    status: "Scheduled",
  },
  {
    client: "Galaxy Company",
    type: "Commercial",
    status: "Delivered",
  },
];

const statusStyles: Record<string, string> = {
  Delivered:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  Scheduled: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  Editing: "border-amber-500/30 bg-amber-500/10 text-amber-400",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function RecentOrders() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View all
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-2">
        {orders.map((order) => (
          <div
            key={order.client}
            className="flex items-center justify-between gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarFallback className="text-xs">
                  {getInitials(order.client)}
                </AvatarFallback>
              </Avatar>

              <div>
                <p className="text-sm font-medium">{order.client}</p>
                <p className="text-xs text-muted-foreground">{order.type}</p>
              </div>
            </div>

            <Badge
              variant="outline"
              className={cn(statusStyles[order.status])}
            >
              {order.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
