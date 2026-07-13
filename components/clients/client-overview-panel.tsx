import Link from "next/link";
import { notFound } from "next/navigation";

import { ClientProfileActions } from "@/components/clients/client-profile-actions";
import { BackLink } from "@/components/navigation/back-link";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import {
  getClientWorkspaceOverview,
  type RelationshipHealth,
} from "@/lib/clients/aggregators";
import { clientWorkspaceHref } from "@/lib/clients/workspace";
import { cn } from "@/lib/utils";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

function formatWhen(value: string | null | undefined) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value.slice(0, 10);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value.slice(0, 10);
  }
}

const HEALTH_STYLES: Record<
  RelationshipHealth,
  { ring: string; text: string; label: string }
> = {
  healthy: {
    ring: "border-emerald-500/40 bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-300",
    label: "Healthy",
  },
  attention: {
    ring: "border-amber-500/45 bg-amber-500/10",
    text: "text-amber-800 dark:text-amber-300",
    label: "Attention",
  },
  risk: {
    ring: "border-soda-pink/50 bg-soda-pink/10",
    text: "text-soda-pink",
    label: "Risk",
  },
  unknown: {
    ring: "border-border/70 bg-muted/30",
    text: "text-muted-foreground",
    label: "New",
  },
};

interface ClientOverviewPanelProps {
  clientId: string;
}

/** Control-room Overview — who, money, what's open, what's next. */
export async function ClientOverviewPanel({
  clientId,
}: ClientOverviewPanelProps) {
  const overview = getClientWorkspaceOverview(clientId);
  if (!overview) notFound();

  const { client, health, healthReason } = overview;
  const healthUi = HEALTH_STYLES[health];
  const backHref =
    client.segment === "commercial" ? "/clients/commercial" : "/clients/weddings";

  const kpis = [
    { label: "Current Balance", value: egp(overview.currentBalance) },
    { label: "Collected", value: egp(overview.collected) },
    {
      label: "Outstanding",
      value: egp(overview.outstanding),
      accent: overview.outstanding > 0,
    },
    { label: "Open orders", value: String(overview.openOrders) },
    { label: "Active projects", value: String(overview.activeProjects) },
  ] as const;

  const pulses = [
    {
      label: "Last activity",
      value: formatWhen(overview.lastActivityAt),
      href: clientWorkspaceHref(clientId, "timeline"),
    },
    {
      label: "Last payment",
      value: overview.lastPayment
        ? `${egp(overview.lastPayment.amount)} · ${formatWhen(overview.lastPayment.paidAt)}`
        : "None yet",
      href: clientWorkspaceHref(clientId, "financial-history"),
    },
    {
      label: "Last order",
      value: overview.lastOrder
        ? `${overview.lastOrder.id} · ${formatWhen(overview.lastOrder.shootDate)}`
        : "None yet",
      href: overview.lastOrder
        ? `/orders/${overview.lastOrder.id}`
        : clientWorkspaceHref(clientId, "daily-work"),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BackLink
          href={backHref}
          label={
            client.segment === "commercial"
              ? "Commercial clients"
              : "Wedding clients"
          }
        />
        <ClientProfileActions client={client} />
      </div>

      <section
        className={cn(
          "relative overflow-hidden rounded-2xl border p-5 sm:p-6",
          "bg-[linear-gradient(135deg,color-mix(in_oklab,var(--soda-purple)_18%,transparent),transparent_55%)]",
          healthUi.ring
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-soda-pink/10 blur-3xl"
        />
        <div className="relative flex flex-wrap items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--soda-purple),var(--soda-pink))] text-lg font-bold text-white">
            {(client.company ?? client.name).slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                {client.name}
              </h2>
              <Badge variant="outline">{overview.roleLabel}</Badge>
              <Badge variant="secondary" className="capitalize">
                {client.segment}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {[client.contactPerson, client.phone, client.email]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className={cn("flex flex-wrap items-center gap-2 text-sm", healthUi.text)}>
              <span className="font-medium">Relationship · {healthUi.label}</span>
              <span className="text-muted-foreground">— {healthReason}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="soda-cc-card rounded-xl border border-border/60 px-3.5 py-3"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {kpi.label}
            </p>
            <p
              className={cn(
                "mt-1 font-mono text-lg font-semibold",
                "accent" in kpi && kpi.accent && "text-soda-pink"
              )}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {pulses.map((pulse) => (
          <Link
            key={pulse.label}
            href={pulse.href}
            className="rounded-xl border border-border/60 px-3.5 py-3 transition-colors hover:border-soda-pink/35"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {pulse.label}
            </p>
            <p className="mt-1 text-sm font-medium">{pulse.value}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(
          [
            ["Daily Work", "daily-work", `${overview.orderCount} orders total`],
            ["Projects", "projects", `${overview.projectCount} projects`],
            ["Financial History", "financial-history", egp(overview.outstanding)],
            ["Timeline", "timeline", "Relationship history"],
          ] as const
        ).map(([label, section, detail]) => (
          <Link
            key={section}
            href={clientWorkspaceHref(clientId, section)}
            className="rounded-xl border border-border/60 px-3.5 py-3 transition-colors hover:border-soda-pink/35"
          >
            <p className="font-heading text-sm font-semibold">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </Link>
        ))}
      </section>

      {overview.lastOrder ? (
        <section className="space-y-2">
          <h3 className="font-heading text-base font-semibold">Now</h3>
          <Link
            href={`/orders/${overview.lastOrder.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3.5 py-3 transition-colors hover:border-soda-pink/35"
          >
            <div>
              <p className="font-medium">{overview.lastOrder.id}</p>
              <p className="text-xs text-muted-foreground">
                {overview.lastOrder.shootDate} → {overview.lastOrder.deliveryDate}
              </p>
            </div>
            <OrderStatusBadge status={overview.lastOrder.status} />
          </Link>
        </section>
      ) : null}
    </div>
  );
}
