import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  Package,
  TrendingUp,
  UsersRound,
  Wallet,
} from "lucide-react";

import AttentionCenter from "@/components/dashboard/attention-center";
import DashboardHero from "@/components/dashboard/dashboard-hero";
import {
  HumanMessage,
  SmartTip,
} from "@/components/dashboard/human-home";
import QuickActions from "@/components/dashboard/quick-actions";
import RecentOrders from "@/components/dashboard/recent-orders";
import TodayFocus from "@/components/dashboard/today-focus";
import UpcomingScheduleCard from "@/components/dashboard/upcoming-schedule";
import { QuotationPipelineCard } from "@/components/quotations/quotation-pipeline-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AccessLevel } from "@/lib/identity/access-levels";
import {
  recentOrdersCopy,
  type DataScope,
} from "@/lib/identity/data-scope";
import type { DashboardSnapshot } from "@/lib/dashboard/types";
import type { Order } from "@/lib/orders/types";
import type { Quotation } from "@/lib/quotations/types";

type VoiceInput = Pick<
  DashboardSnapshot,
  "kpis" | "attention" | "schedule"
>;

function WidgetCard({
  title,
  description,
  children,
  href,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  href?: string;
}) {
  const header = (
    <CardHeader className="pb-2">
      <CardTitle className="text-base">{title}</CardTitle>
      {description ? (
        <CardDescription
          className="font-ar text-[0.9375rem] leading-[1.8] text-muted-foreground"
          dir="rtl"
        >
          {description}
        </CardDescription>
      ) : null}
    </CardHeader>
  );

  return (
    <Card className="soda-cc-card h-full">
      {href ? (
        <Link href={href} className="block transition-colors hover:text-soda-pink">
          {header}
        </Link>
      ) : (
        header
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

function OrderLines({
  orders,
  empty,
}: {
  orders: Order[];
  empty: string;
}) {
  if (orders.length === 0) return <EmptyLine text={empty} />;
  return (
    <ul className="space-y-2">
      {orders.slice(0, 6).map((o) => (
        <li key={o.id}>
          <Link
            href={`/orders/${o.id}`}
            className="text-sm transition-colors hover:text-soda-pink"
          >
            {o.clientName} · {o.status}
            <span className="ml-2 text-muted-foreground">{o.shootDate}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function QuotationLines({
  quotations,
  empty,
}: {
  quotations: Quotation[];
  empty: string;
}) {
  if (quotations.length === 0) return <EmptyLine text={empty} />;
  return (
    <ul className="space-y-2">
      {quotations.slice(0, 6).map((q) => (
        <li key={q.id}>
          <Link
            href={`/quotations/${q.id}`}
            className="text-sm transition-colors hover:text-soda-pink"
          >
            {q.clientName || q.id} · {q.pipelineStage}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export type AccessLevelHomeProps = {
  accessLevel: AccessLevel;
  operatorName: string | null;
  voiceInput: VoiceInput;
  dashboard: DashboardSnapshot;
  allowedPermissions?: readonly string[];
  scope: DataScope;
  scopedOrders: Order[];
  pendingQuotations: Quotation[];
  followUpQuotations: Quotation[];
  waitingClientOrders: Order[];
  activeCommercialOrders: Order[];
  teamOrders: Order[];
  pendingDeliveries: Order[];
  scopeNote: string | null;
};

/** Role-scoped Home — Founder keeps the classic company command center elsewhere. */
export function AccessLevelHome(props: AccessLevelHomeProps) {
  const {
    accessLevel,
    operatorName,
    voiceInput,
    dashboard,
    allowedPermissions,
    scopedOrders,
    pendingQuotations,
    followUpQuotations,
    waitingClientOrders,
    activeCommercialOrders,
    teamOrders,
    pendingDeliveries,
    scopeNote,
  } = props;

  if (accessLevel === "account_manager") {
    const nonFinanceAttention = dashboard.attention.filter(
      (a) => a.category !== "unpaid_client" && a.category !== "waiting_payment"
    );
    const recentCopy = recentOrdersCopy("account_manager");

    return (
      <div className="soda-page-enter space-y-3 sm:space-y-4">
        <DashboardHero dashboard={voiceInput} operatorName={operatorName} />
        {scopeNote ? (
          <p className="text-sm text-muted-foreground">{scopeNote}</p>
        ) : null}

        <QuickActions
          allowedPermissions={allowedPermissions}
          accessLevel={accessLevel}
        />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4 xl:grid-cols-3">
          <WidgetCard
            title="My Quotations"
            description="عروض أسعار لسه في البايبلاين"
            href="/quotations"
          >
            <QuotationLines
              quotations={pendingQuotations}
              empty="No pending quotations."
            />
          </WidgetCard>
          <WidgetCard
            title="My Pipeline"
            description="متابعة ردود العملاء"
            href="/quotations"
          >
            <QuotationLines
              quotations={followUpQuotations}
              empty="No client follow-ups waiting."
            />
          </WidgetCard>
          <WidgetCard
            title="My Orders"
            description="أوردرات تجارية شغالة"
            href="/orders"
          >
            <OrderLines
              orders={activeCommercialOrders}
              empty="No active commercial orders in your scope."
            />
          </WidgetCard>
          <WidgetCard
            title="My Clients"
            description="مستنيين رد العميل"
            href="/clients"
          >
            <OrderLines
              orders={waitingClientOrders}
              empty="No orders waiting on a client."
            />
          </WidgetCard>
          <div className="lg:col-span-2">
            <UpcomingScheduleCard schedule={dashboard.schedule} />
          </div>
        </div>

        <RecentOrders
          orders={dashboard.recentOrders}
          title={recentCopy.title}
          description={recentCopy.description}
        />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          <AttentionCenter items={nonFinanceAttention} showViewAll={false} />
          <QuotationPipelineCard />
        </div>
      </div>
    );
  }

  if (accessLevel === "team_leader") {
    const opsAttention = dashboard.attention.filter(
      (a) =>
        a.category !== "unpaid_client" &&
        a.category !== "waiting_payment"
    );
    const recentCopy = recentOrdersCopy("team_leader");

    return (
      <div className="soda-page-enter space-y-3 sm:space-y-4">
        <DashboardHero dashboard={voiceInput} operatorName={operatorName} />
        {scopeNote ? (
          <p className="text-sm text-muted-foreground">{scopeNote}</p>
        ) : null}

        <QuickActions
          allowedPermissions={allowedPermissions}
          accessLevel={accessLevel}
        />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4 xl:grid-cols-3">
          <WidgetCard title="My Team" href="/orders">
            <OrderLines
              orders={teamOrders}
              empty="No team orders yet — assign crew on real work."
            />
          </WidgetCard>
          <WidgetCard title="My Orders" href="/orders">
            <OrderLines
              orders={teamOrders}
              empty="No orders in your team scope."
            />
          </WidgetCard>
          <UpcomingScheduleCard schedule={dashboard.schedule} />
          <WidgetCard title="My Team Schedule" href="/calendar">
            {dashboard.schedule.todayShoots.length === 0 ? (
              <EmptyLine text="No shoots scheduled today for your team." />
            ) : (
              <ul className="space-y-2">
                {dashboard.schedule.todayShoots.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <Link
                      href={s.href || `/orders/${s.orderId}`}
                      className="text-sm hover:text-soda-pink"
                    >
                      {s.title} · {s.clientName}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </WidgetCard>
          <WidgetCard title="Pending Deliveries" href="/orders">
            <OrderLines
              orders={pendingDeliveries}
              empty="No pending deliveries on team work."
            />
          </WidgetCard>
          <WidgetCard title="My Team Notifications" href="/notifications">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bell className="size-4" />
              Open notifications for team signals.
            </div>
          </WidgetCard>
        </div>

        <RecentOrders
          orders={dashboard.recentOrders}
          title={recentCopy.title}
          description={recentCopy.description}
        />

        {opsAttention.length > 0 ? (
          <AttentionCenter items={opsAttention} showViewAll={false} />
        ) : null}
      </div>
    );
  }

  // Team — personal mission board only
  const recentCopy = recentOrdersCopy("team");
  const personalLinks = [
    { href: "/orders", title: "My Orders", icon: ClipboardList },
    { href: "/calendar", title: "My Calendar", icon: CalendarDays },
    { href: "/me/files", title: "My Files", icon: FolderOpen },
    { href: "/me/performance", title: "My Work", icon: TrendingUp },
    { href: "/me/wallet", title: "Wallet", icon: Wallet },
    { href: "/notifications", title: "My Notifications", icon: Bell },
  ] as const;

  return (
    <div className="soda-page-enter space-y-3 sm:space-y-4">
      <DashboardHero dashboard={voiceInput} operatorName={operatorName} />
      {scopeNote ? (
        <p className="text-sm text-muted-foreground">{scopeNote}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-5 lg:gap-4">
        <div className="lg:col-span-3">
          <TodayFocus dashboard={voiceInput} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
          <HumanMessage dashboard={voiceInput} operatorName={operatorName} />
          <SmartTip dashboard={voiceInput} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {personalLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-border/70 bg-card/60 p-4 transition-colors hover:border-soda-pink/40"
            >
              <div className="flex items-center gap-3">
                <Icon className="size-5 text-soda-pink" />
                <span className="font-medium">{item.title}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        <WidgetCard title="My Tasks" href="/orders">
          <OrderLines
            orders={scopedOrders}
            empty="No assigned orders yet."
          />
        </WidgetCard>
        <UpcomingScheduleCard schedule={dashboard.schedule} />
      </div>

      <RecentOrders
        orders={dashboard.recentOrders}
        title={recentCopy.title}
        description={recentCopy.description}
      />

      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <UsersRound className="size-4" /> Personal workspace only
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Package className="size-4" /> Company modules stay hidden
        </span>
      </div>
    </div>
  );
}
