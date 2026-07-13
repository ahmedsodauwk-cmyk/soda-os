import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  getClientTimeline,
  type ClientTimelineKind,
} from "@/lib/clients/aggregators";

const KIND_LABEL: Record<ClientTimelineKind, string> = {
  client_created: "Client",
  order: "Order",
  payment: "Payment",
  project_started: "Project",
  project_closed: "Project",
  invoice: "Invoice",
  partnership: "Partner",
  business_event: "Event",
};

function formatWhen(value: string) {
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value.slice(0, 16);
    return d.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: value.includes("T") ? "2-digit" : undefined,
      minute: value.includes("T") ? "2-digit" : undefined,
    });
  } catch {
    return value.slice(0, 16);
  }
}

interface ClientTimelinePanelProps {
  clientId: string;
}

/** Chronological relationship timeline from real entities + business events. */
export function ClientTimelinePanel({ clientId }: ClientTimelinePanelProps) {
  const view = getClientTimeline(clientId);

  if (view.items.length === 0) {
    return (
      <div className="space-y-3 rounded-2xl border border-border/60 px-4 py-6">
        <h3 className="font-heading text-base font-semibold">Timeline</h3>
        <p className="text-sm text-muted-foreground">
          No relationship events yet for this client.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-base font-semibold">Timeline</h3>
        <p className="text-sm text-muted-foreground">
          Real history only — openings, orders, payments, projects, invoices.
        </p>
      </div>

      <ol className="relative space-y-0 border-s border-border/70 ms-3">
        {view.items.map((item) => {
          const body = (
            <div className="rounded-xl border border-border/60 px-3.5 py-3 transition-colors hover:border-soda-pink/35">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{KIND_LABEL[item.kind]}</Badge>
                <time className="text-xs text-muted-foreground">
                  {formatWhen(item.at)}
                </time>
              </div>
              <p className="mt-1.5 font-medium">{item.title}</p>
              {item.detail ? (
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              ) : null}
            </div>
          );

          return (
            <li key={item.id} className="relative ms-6 pb-4">
              <span
                aria-hidden
                className="absolute -start-[1.65rem] top-4 size-2.5 rounded-full bg-[linear-gradient(135deg,var(--soda-purple),var(--soda-pink))] ring-4 ring-background"
              />
              {item.href ? <Link href={item.href}>{body}</Link> : body}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
