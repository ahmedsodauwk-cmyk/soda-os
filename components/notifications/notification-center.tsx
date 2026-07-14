"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  ArrowUpDown,
  CheckCheck,
  Filter,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  NotificationDecisionButtons,
  notificationNeedsDecision,
} from "@/components/notifications/notification-decision-buttons";
import { useNotificationLive } from "@/components/notifications/notification-live-store";
import {
  CategoryBadge,
  NT_MOTION,
  SMART_FILTERS,
  SORT_LABELS,
  type SmartFilterKey,
  type SortKey,
  categoryGlyph,
  entityLine,
  formatNotificationWhen,
  matchesSmartFilter,
  notificationCardClass,
  priorityVisual,
  signalGlyph,
  sortNotifications,
  statusLine,
} from "@/components/notifications/notification-visuals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  notificationActionLabel,
  notificationDisplayBody,
  notificationDisplayTitle,
  notificationHref,
  notificationPriorityLabel,
} from "@/lib/core/notifications/engine";
import { groupNotificationsByTimeline } from "@/lib/core/notifications/grouping";
import { lifecycleLabel } from "@/lib/core/notifications/lifecycle";
import type { NotificationRecord } from "@/lib/core/types";
import { cn } from "@/lib/utils";

function SwipeRow({
  children,
  onRead,
  onArchive,
  onOpen,
}: {
  children: React.ReactNode;
  onRead: () => void;
  onArchive: () => void;
  onOpen: () => void;
}) {
  const startX = useRef<number | null>(null);
  const [offset, setOffset] = useState(0);

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      onTouchStart={(e) => {
        startX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchMove={(e) => {
        if (startX.current == null) return;
        const x = e.touches[0]?.clientX ?? startX.current;
        const dx = x - startX.current;
        setOffset(Math.max(-108, Math.min(108, dx)));
      }}
      onTouchEnd={() => {
        if (offset <= -72) onArchive();
        else if (offset >= 72) onRead();
        else if (Math.abs(offset) < 8) onOpen();
        setOffset(0);
        startX.current = null;
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 end-0 flex w-[108px] items-center justify-center bg-soda-pink/20 px-2"
        aria-hidden
      >
        <span className="font-ar text-[11px] font-medium text-soda-pink">
          اتقراء
        </span>
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 start-0 flex w-[108px] items-center justify-center bg-muted px-2"
        aria-hidden
      >
        <span className="font-ar text-[11px] text-muted-foreground">أرشيف</span>
      </div>
      <div
        className={cn(NT_MOTION, "relative")}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  );
}

function UnreadDot({ unread }: { unread: boolean }) {
  return (
    <span
      className={cn(
        NT_MOTION,
        "mt-1.5 size-2.5 shrink-0 rounded-full",
        unread
          ? "scale-100 bg-soda-pink opacity-100 shadow-[0_0_0_4px_var(--soda-pink-soft)]"
          : "scale-75 bg-transparent opacity-0 shadow-none"
      )}
      aria-hidden={!unread}
      aria-label={unread ? "غير مقروء" : undefined}
    />
  );
}

function QuickActions({
  item,
  onOpen,
  onMarkRead,
  onDismiss,
}: {
  item: NotificationRecord;
  onOpen: () => void;
  onMarkRead: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Button
        type="button"
        size="sm"
        className="h-8 min-h-8 cursor-pointer bg-soda-pink px-2.5 text-xs text-soda-action-foreground hover:bg-soda-pink/90"
        onClick={onOpen}
      >
        افتح
      </Button>
      {item.status === "unread" ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 min-h-8 cursor-pointer px-2.5 text-xs"
          onClick={onMarkRead}
        >
          اتقراء
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-8 min-h-8 cursor-pointer px-2.5 text-xs text-muted-foreground"
        onClick={onDismiss}
      >
        تجاهل
      </Button>
    </div>
  );
}

type RowHandlers = {
  item: NotificationRecord;
  selected: boolean;
  checked: boolean;
  onToggleCheck: () => void;
  onSelect: () => void;
  onOpenLink: () => void;
  onMarkRead: () => void;
  onArchive: () => void;
  onDismiss: () => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
};

function NotificationCardSurface({
  item,
  selected,
  checked,
  onToggleCheck,
  onSelect,
  onOpenLink,
  onMarkRead,
  onDismiss,
  onHover,
  onHoverEnd,
  dense,
}: RowHandlers & { dense?: boolean }) {
  const unread = item.status === "unread";
  const visual = priorityVisual(item.priority);
  const priorityLabel = notificationPriorityLabel(item.priority);
  const signal = signalGlyph(item);
  const needs = notificationNeedsDecision(item);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        notificationCardClass(item, { selected }),
        "group flex cursor-pointer gap-3",
        dense ? "min-h-[4.75rem]" : "min-h-[5rem]"
      )}
    >
      <span
        className={cn(
          NT_MOTION,
          "absolute inset-y-2.5 start-0 w-[3px] rounded-full",
          selected ? "bg-soda-pink" : visual.bar,
          !unread && !selected && "opacity-40"
        )}
        aria-hidden
      />
      <label
        className="mt-1 flex shrink-0 items-start ps-1"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggleCheck}
          className="size-4 cursor-pointer accent-[var(--soda-pink)]"
          aria-label="اختيار التنبيه"
        />
      </label>

      <div
        className={cn(
          NT_MOTION,
          "flex shrink-0 items-center justify-center rounded-xl text-lg",
          dense ? "size-10" : "size-11 text-xl",
          unread
            ? "bg-soda-pink/15 ring-1 ring-soda-pink/25"
            : "bg-muted/60"
        )}
        aria-hidden
      >
        <span>{signal ?? categoryGlyph(item.category)}</span>
      </div>

      <div className="min-w-0 flex-1" dir="rtl">
        <div className="flex items-start gap-2">
          <UnreadDot unread={unread} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p
                className={cn(
                  NT_MOTION,
                  "font-ar text-sm leading-snug",
                  unread
                    ? "font-bold text-foreground"
                    : "font-normal text-foreground/80"
                )}
              >
                {notificationDisplayTitle(item)}
              </p>
              {priorityLabel ? (
                <span
                  className={cn(
                    "rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
                    visual.chip
                  )}
                >
                  {priorityLabel}
                </span>
              ) : null}
              {needs ? (
                <Badge
                  variant="secondary"
                  className="h-5 bg-soda-pink/15 px-1.5 text-[10px] text-soda-pink"
                >
                  محتاج رد
                </Badge>
              ) : null}
            </div>

            <p className="font-ar mt-0.5 truncate text-xs text-muted-foreground">
              <span className="text-foreground/70">{entityLine(item)}</span>
              <span className="mx-1.5 opacity-40" aria-hidden>
                ·
              </span>
              <CategoryBadge category={item.category} />
            </p>

            <p
              className={cn(
                NT_MOTION,
                "font-ar mt-1 line-clamp-2 text-xs",
                unread ? "text-foreground/80" : "text-muted-foreground"
              )}
            >
              {notificationDisplayBody(item)}
            </p>

            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span>{formatNotificationWhen(item.createdAt)}</span>
              <span aria-hidden>·</span>
              <span className="font-ar text-soda-pink">{statusLine(item)}</span>
            </div>

            <QuickActions
              item={item}
              onOpen={onOpenLink}
              onMarkRead={onMarkRead}
              onDismiss={onDismiss}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationRowDesktop(props: RowHandlers) {
  return (
    <Tooltip>
      <TooltipTrigger className="block w-full text-start" render={<div />}>
        <NotificationCardSurface {...props} dense />
      </TooltipTrigger>
      <TooltipContent
        side="left"
        align="start"
        className="max-w-xs flex-col items-start gap-1 border border-soda-pink/25 bg-popover p-3 text-start text-popover-foreground"
        dir="rtl"
      >
        <p className="font-ar text-xs font-semibold">
          {notificationDisplayTitle(props.item)}
        </p>
        <p className="font-ar line-clamp-3 text-[11px] text-muted-foreground">
          {notificationDisplayBody(props.item)}
        </p>
        <p className="font-ar text-[11px] text-soda-pink">
          {notificationActionLabel(props.item)} · {entityLine(props.item)}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function NotificationRowMobile(props: RowHandlers) {
  return (
    <SwipeRow
      onRead={props.onMarkRead}
      onArchive={props.onArchive}
      onOpen={props.onSelect}
    >
      <NotificationCardSurface {...props} />
    </SwipeRow>
  );
}

function DetailPanel({
  item,
  emptyHint,
  onCloseMobile,
}: {
  item: NotificationRecord | null;
  emptyHint: string;
  onCloseMobile?: () => void;
}) {
  const live = useNotificationLive();

  if (!item) {
    return (
      <div
        className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center"
        dir="rtl"
      >
        <span className="text-3xl opacity-70" aria-hidden>
          🔔
        </span>
        <p className="font-ar text-sm text-muted-foreground">{emptyHint}</p>
      </div>
    );
  }

  const href = notificationHref(item);
  const visual = priorityVisual(item.priority);
  const navActions =
    item.actions?.filter(
      (a) =>
        a.enabled !== false &&
        a.href &&
        (a.kind === "open" ||
          a.kind === "navigate" ||
          a.kind === "view" ||
          a.kind === "view_order" ||
          a.kind === "assign_crew" ||
          a.kind === "mark_paid" ||
          a.kind === "mark_delivered" ||
          a.kind === "call")
    ) ?? [];

  return (
    <div
      className={cn(
        NT_MOTION,
        "flex h-full flex-col overflow-hidden rounded-xl border border-soda-pink/20 bg-[linear-gradient(160deg,color-mix(in_oklch,var(--soda-pink)_8%,transparent)_0%,var(--card)_40%)]"
      )}
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="flex size-9 items-center justify-center rounded-lg bg-soda-pink/15 text-lg"
              aria-hidden
            >
              {signalGlyph(item) ?? categoryGlyph(item.category)}
            </span>
            <h2 className="font-ar text-base font-semibold leading-snug">
              {notificationDisplayTitle(item)}
            </h2>
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
                visual.chip
              )}
            >
              {notificationPriorityLabel(item.priority)}
            </span>
          </div>
          <p className="font-ar text-sm text-foreground/85">
            {notificationDisplayBody(item)}
          </p>
        </div>
        {onCloseMobile ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="shrink-0 cursor-pointer md:hidden"
            onClick={onCloseMobile}
            aria-label="إغلاق"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        <section className="space-y-1.5">
          <h3 className="font-ar text-xs font-medium text-muted-foreground">
            الحالة
          </h3>
          <p className="font-ar text-sm">
            {lifecycleLabel(item.status)}
            {item.requiresAck ? " · محتاج تأكيد" : ""}
          </p>
          <p className="font-ar text-xs text-muted-foreground">
            {formatNotificationWhen(item.createdAt)} ·{" "}
            <CategoryBadge category={item.category} className="inline" />
          </p>
          <p className="font-ar text-xs text-foreground/70">
            مرتبط: {entityLine(item)}
          </p>
        </section>

        {item.relatedObjects && item.relatedObjects.length > 0 ? (
          <section className="space-y-2">
            <h3 className="font-ar text-xs font-medium text-muted-foreground">
              العميل / الأوردر
            </h3>
            <ul className="space-y-1.5">
              {item.relatedObjects.map((rel) => (
                <li key={`${rel.href}-${rel.label}`}>
                  <Link
                    href={rel.href}
                    className="font-ar inline-flex min-h-10 items-center rounded-lg border border-border/60 bg-background/50 px-3 text-sm text-soda-pink transition-colors hover:border-soda-pink/40 hover:bg-soda-pink/5"
                    onClick={() => live.markRead(item.id)}
                  >
                    {rel.label}
                    {rel.id ? (
                      <span className="ms-1 text-muted-foreground">
                        ({rel.id.slice(0, 8)})
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-2">
          <h3 className="font-ar text-xs font-medium text-muted-foreground">
            إجراءات سريعة
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              nativeButton={false}
              render={
                <Link href={href} onClick={() => live.markRead(item.id)} />
              }
              size="sm"
              className="min-h-10 cursor-pointer bg-soda-pink text-soda-action-foreground hover:bg-soda-pink/90"
            >
              افتح
            </Button>
            {item.status === "unread" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="min-h-10 cursor-pointer"
                onClick={() => live.markRead(item.id)}
              >
                اتقراء
              </Button>
            ) : null}
            {navActions
              .filter((a) => a.href !== href)
              .slice(0, 4)
              .map((a) => (
                <Button
                  key={`${a.kind}-${a.label}`}
                  nativeButton={false}
                  render={
                    <Link
                      href={a.href!}
                      onClick={() => live.markRead(item.id)}
                    />
                  }
                  size="sm"
                  variant="outline"
                  className="min-h-10 cursor-pointer"
                >
                  {a.label}
                </Button>
              ))}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="min-h-10 cursor-pointer"
              onClick={() => live.dismiss(item.id)}
            >
              تجاهل
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="min-h-10 cursor-pointer"
              onClick={() => live.archive(item.id)}
            >
              أرشيف
            </Button>
          </div>
          <NotificationDecisionButtons
            notificationId={item.id}
            actions={item.actions}
          />
        </section>

        <section className="space-y-2">
          <h3 className="font-ar text-xs font-medium text-muted-foreground">
            التايملاين
          </h3>
          <ol className="space-y-3 border-s border-border/70 ps-3">
            {(item.history && item.history.length > 0
              ? item.history
              : [
                  {
                    at: item.createdAt,
                    status: item.status,
                    note: "اتعمل التنبيه",
                  },
                ]
            ).map((h, idx) => (
              <li key={`${h.at}-${idx}`} className="relative">
                <span className="absolute -start-[17px] top-1.5 size-2 rounded-full bg-soda-pink/80" />
                <p className="font-ar text-sm">
                  {h.note ??
                    lifecycleLabel(
                      h.status === "archived" || h.status === "dismissed"
                        ? "completed"
                        : h.status
                    )}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatNotificationWhen(h.at)}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

function MobileDetailDrawer({
  item,
  open,
  onOpenChange,
}: {
  item: NotificationRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[min(100dvh,100%)] max-h-[100dvh] gap-0 overflow-hidden rounded-t-2xl p-0 sm:max-w-none"
        dir="rtl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>تفاصيل التنبيه</SheetTitle>
          <SheetDescription>لوحة تفاصيل التنبيه</SheetDescription>
        </SheetHeader>
        <div className="h-full overflow-y-auto p-1 pb-[env(safe-area-inset-bottom)]">
          <DetailPanel
            item={item}
            emptyHint="اختار تنبيه من القائمة."
            onCloseMobile={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function NotificationCenter({ subtitle }: { subtitle: string }) {
  const live = useNotificationLive();
  const router = useRouter();
  const [filter, setFilter] = useState<SmartFilterKey>("unread");
  const [sort, setSort] = useState<SortKey>("newest");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = live.items.filter((n) => {
      const needs = notificationNeedsDecision(n);
      if (!matchesSmartFilter(n, filter, needs)) return false;
      if (!q) return true;
      const hay = [
        notificationDisplayTitle(n),
        notificationDisplayBody(n),
        entityLine(n),
        n.category,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    return sortNotifications(base, sort);
  }, [live.items, filter, query, sort]);

  const groups = useMemo(
    () => groupNotificationsByTimeline(filtered),
    [filtered]
  );

  const detailId = selectedId ?? previewId;
  const detailItem = useMemo(
    () => live.items.find((n) => n.id === detailId) ?? null,
    [live.items, detailId]
  );

  useEffect(() => {
    if (selectedId && !live.items.some((n) => n.id === selectedId)) {
      setSelectedId(null);
    }
  }, [live.items, selectedId]);

  function selectItem(item: NotificationRecord, opts?: { mobile?: boolean }) {
    setSelectedId(item.id);
    if (opts?.mobile) setDrawerOpen(true);
    if (item.status === "unread") live.markRead(item.id);
  }

  function openLink(item: NotificationRecord) {
    if (item.status === "unread") live.markRead(item.id);
    router.push(notificationHref(item));
  }

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const readIds = useMemo(
    () => live.items.filter((n) => n.status === "read").map((n) => n.id),
    [live.items]
  );
  const completedIds = useMemo(
    () => live.items.filter((n) => n.status === "completed").map((n) => n.id),
    [live.items]
  );

  const emptyHint =
    filter === "unread"
      ? "مفيش تنبيهات جديدة — كله اتقرا ✓"
      : "اختار تنبيه من على الشمال عشان تشوف التفاصيل.";

  return (
    <TooltipProvider delay={300}>
      <div className="space-y-4" dir="rtl">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-ar text-xl font-semibold tracking-tight">
              مركز التنبيهات
            </h1>
            <p className="font-ar mt-1 text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                NT_MOTION,
                "h-7 bg-soda-pink/15 px-2.5 font-ar text-soda-pink",
                live.unreadCount > 0 &&
                  "shadow-[0_0_12px_color-mix(in_srgb,var(--soda-pink)_35%,transparent)]"
              )}
            >
              {live.unreadCount} جديد
            </Badge>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-9 cursor-pointer gap-1.5"
              disabled={live.unreadCount === 0}
              onClick={() => live.markAllRead()}
            >
              <CheckCheck className="size-3.5" />
              اقرأ الكل
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-9 cursor-pointer gap-1.5"
              disabled={readIds.length === 0}
              onClick={() => {
                for (const id of readIds) live.archive(id);
              }}
            >
              <Archive className="size-3.5" />
              أرشف المقروء
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="min-h-9 cursor-pointer gap-1.5"
              disabled={completedIds.length === 0}
              onClick={() => {
                for (const id of completedIds) live.dismiss(id);
              }}
            >
              <Trash2 className="size-3.5" />
              امسح المكتمل
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="min-h-9 cursor-pointer gap-1.5"
              disabled={checked.size === 0}
              onClick={() => {
                live.markRead([...checked]);
                setChecked(new Set());
              }}
            >
              اقرأ المحدد
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="دوّر في التنبيهات…"
              className="font-ar h-9 ps-8"
              aria-label="بحث"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-9 cursor-pointer gap-1.5"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <Filter className="size-3.5" />
              فلتر
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-9 cursor-pointer gap-1.5"
              onClick={() =>
                setSort((s) =>
                  s === "newest"
                    ? "oldest"
                    : s === "oldest"
                      ? "priority"
                      : "newest"
                )
              }
            >
              <ArrowUpDown className="size-3.5" />
              {SORT_LABELS[sort]}
            </Button>
          </div>
        </div>

        {filtersOpen ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {SMART_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  NT_MOTION,
                  "font-ar inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-lg px-2.5 text-xs",
                  filter === f.key
                    ? "bg-soda-pink text-soda-action-foreground shadow-sm"
                    : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {f.icon ? <span aria-hidden>{f.icon}</span> : null}
                {f.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
          <div className="min-w-0 space-y-4">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-14 text-center">
                <p className="font-ar text-sm text-muted-foreground">
                  {filter === "unread"
                    ? "مفيش حاجة جديدة دلوقتي — كله تمام."
                    : "مفيش تنبيهات في الفلتر ده دلوقتي."}
                </p>
              </div>
            ) : (
              groups.map((group) => (
                <section key={group.key} className="space-y-2">
                  <h2 className="font-ar sticky top-0 z-[1] bg-background/85 py-1 text-xs font-medium tracking-wide text-muted-foreground backdrop-blur-sm">
                    {group.label}
                  </h2>
                  <div className="space-y-2">
                    {group.items.map((item) => {
                      const props: RowHandlers = {
                        item,
                        selected: selectedId === item.id,
                        checked: checked.has(item.id),
                        onToggleCheck: () => toggleCheck(item.id),
                        onSelect: () => {
                          const mobile =
                            typeof window !== "undefined" &&
                            window.matchMedia("(max-width: 1023px)").matches;
                          selectItem(item, { mobile });
                        },
                        onOpenLink: () => openLink(item),
                        onMarkRead: () => live.markRead(item.id),
                        onArchive: () => live.archive(item.id),
                        onDismiss: () => live.dismiss(item.id),
                        onHover: () => setPreviewId(item.id),
                        onHoverEnd: () =>
                          setPreviewId((id) => (id === item.id ? null : id)),
                      };
                      return (
                        <div key={item.id}>
                          <div className="hidden lg:block">
                            <NotificationRowDesktop {...props} />
                          </div>
                          <div className="lg:hidden">
                            <NotificationRowMobile {...props} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))
            )}

            <p className="font-ar text-[11px] text-muted-foreground lg:hidden">
              اسحب يمين = اتقراء · شمال = أرشيف · اضغط = التفاصيل كاملة
            </p>
          </div>

          <aside className="sticky top-3 hidden min-h-[420px] lg:block">
            <DetailPanel item={detailItem} emptyHint={emptyHint} />
          </aside>
        </div>

        <MobileDetailDrawer
          item={detailItem}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      </div>
    </TooltipProvider>
  );
}
