import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const team = [
  { name: "Nemo", status: "On Shoot" },
  { name: "Ahmed", status: "Available" },
  { name: "Mohamed", status: "Editing" },
  { name: "Youssef", status: "Off" },
];

const statusDot: Record<string, string> = {
  "On Shoot": "bg-amber-500",
  Available: "bg-emerald-500",
  Editing: "bg-blue-500",
  Off: "bg-muted-foreground",
};

function getInitials(name: string) {
  return name.slice(0, 1).toUpperCase();
}

export default function TeamStatus() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Status</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {team.map((member) => (
          <div
            key={member.name}
            className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar size="sm">
                  <AvatarFallback className="text-xs">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-card",
                    statusDot[member.status]
                  )}
                />
              </div>

              <span className="text-sm font-medium">{member.name}</span>
            </div>

            <Badge variant="outline">{member.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
