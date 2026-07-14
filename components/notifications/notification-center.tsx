"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Archive,
  CheckCheck,
  ChevronLeft,
  Filter,
  Trash2,
} from "lucide-react";

import {
  NotificationDecisionButtons,
  notificationNeedsDecision,
} from "@/components/notifications/notification-decision-buttons";
import { useNotificationLive } from "@/components/notifications/notification-live-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  NOTIFICATION_CATEGORY_LABELS,
  categoryLabel,
} from "@/lib/core/notifications/categories";
import {
  notificationActionLabel,
  notificationDisplayBody,
  notificationDisplayTitle,
  notificationHref,
  notificationPriorityLabel,
  notificationPriorityTier,
} from "@/lib/core/notifications/engine";
import { groupNotificationsByTimeline } from "@/lib/core/notifications/grouping";
import { lifecycleLabel } from "@/lib/core/notifications/lifecycle";
import type {
  NotificationCategory,
  NotificationRecord,
} from "@/lib/core/types";
import { cn } from "@/lib/utils";

const CATEGORY_FILTERS: Array<NotificationCategory | "all"> = [
  "all",
  "orders",
  "finance",
  "crew",
  "calendar",
  "clients",
  "authority",
  "brain",
  "system",
  "personal",
];

function priorityVisual(priority: NotificationRecord["priority"]) {
  const tier = notificationPriorityTier(priority);
  switch (tier) {
    case "critical":
      return {
        bar: "bg-destructive",
        chip: "bg-destructive/15 text-destructive",
        ring: "ring-destructive/30",
      };
    case "high":
      return {
        bar: "bg-soda-pink",
        chip: "bg-soda-pink/15 text-soda-pink",
        ring: "ring-soda-pink/25",
      };
    case "info":
      return {
        bar: "bg-muted-foreground/40",
        chip: "bg-muted text-muted-foreground",
        ring: "ring-transparent",
      };
    default:
      return {
        bar: "bg-soda-purple/40",
        chip: "bg-muted text-foreground/80",
        ring: "ring-transparent",
      };
  }
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
    return d.toLocaleString("ar-EG", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

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
        // RTL: swipe left (negative in LTR coords) reveals actions — clamp
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
        className="pointer-events-none absolute inset-y-0 end-0 flex w-[108px] items-center justify-center gap-1 bg-soda-pink/15 px-2"
        aria-hidden
      >
        <span className="font-ar text-[11px] text-soda-pink">اتقراء</span>
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 start-0 flex w-[108px] items-center justify-center gap-1 bg-muted px-2"
        aria-hidden
      >
        <span className="font-ar text-[11px] text-muted-foreground">أرشيف</span>
      </div>
      <div
        className="relative transition-transform duration-150 ease-out"
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  );
}

function NotificationRow({
  item,
  selected,
  checked,
  onToggleCheck,
  onOpen,
  onMarkRead,
  onArchive,
}: {
  item: NotificationRecord;
  selected: boolean;
  checked: boolean;
  onToggleCheck: () => void;
  onOpen: () => void;
  onMarkRead: () => void;
  onArchive: () => void;
}) {
  const unread = item.status === "unread";
  const visual = priorityVisual(item.priority);
  const priorityLabel = notificationPriorityLabel(item.priority);

  return (
    <SwipeRow
      onRead={onMarkRead}
      onArchive={onArchive}
      onOpen={onOpen}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className={cn(
          "group relative flex min-h-[4.5rem] cursor-pointer gap-3 rounded-xl border px-3 py-3 text-start transition-colors",
          unread
            ? "border-soda-pink/20 bg-soda-pink/[0.06] ring-1"
            : "border-border/60 bg-background/40 hover:bg-muted/40",
          unread ? visual.ring : "",
          selected && "border-soda-pink/40 bg-soda-pink/10"
        )}
      >
        <span
          className={cn("absolute inset-y-3 start-0 w-0.5 rounded-full", visual.bar)}
          aria-hidden
        />
        <label
          className="mt-1 flex shrink-0 items-start"
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
        <div className="min-w-0 flex-1" dir="rtl">
          <div className="flex items-start gap-2">
            {unread ? (
              <span
                className="mt-1.5 size-2 shrink-0 rounded-full bg-soda-pink shadow-[0_0_0_3px_var(--soda-pink-soft)]"
                aria-label="غير مقروء"
              />
            ) : (
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-transparent" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p
                  className={cn(
                    "font-ar text-sm leading-snug",
                    unread
                      ? "font-semibold text-foreground"
                      : "font-medium text-foreground/85"
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
                {notificationNeedsDecision(item) ? (
                  <Badge
                    variant="secondary"
                    className="h-5 bg-soda-pink/15 px-1.5 text-[10px] text-soda-pink"
                  >
                    محتاج رد
                  </Badge>
                ) : null}
              </div>
              <p
                className={cn(
                  "font-ar mt-0.5 line-clamp-2 text-xs",
                  unread ? "text-foreground/75" : "text-muted-foreground"
                )}
              >
                {notificationDisplayBody(item)}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-ar">{categoryLabel(item.category)}</span>
                <span aria-hidden>·</span>
                <span>{formatWhen(item.createdAt)}</span>
                <span aria-hidden>·</span>
                <span className="font-ar text-soda-pink">
                  {notificationActionLabel(item)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <ChevronLeft className="mt-1 size-4 shrink-0 text-muted-foreground opacity-50 transition group-hover:opacity-100" />
      </div>
    </SwipeRow>
  );
}

function DetailDrawer({
  item,
  open,
  onOpenChange,
}: {
  item: NotificationRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const live = useNotificationLive();
  if (!item) return null;
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-full gap-0 overflow-y-auto sm:max-w-md"
        dir="rtl"
      >
        <SheetHeader className="border-b pb-4 text-start">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="font-ar text-base">
              {notificationDisplayTitle(item)}
            </SheetTitle>
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
                visual.chip
              )}
            >
              {notificationPriorityLabel(item.priority)}
            </span>
          </div>
          <SheetDescription className="font-ar text-sm text-foreground/80">
            {notificationDisplayBody(item)}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 px-4 py-4">
          <section className="space-y-1.5">
            <h3 className="font-ar text-xs font-medium text-muted-foreground">
              الحالة
            </h3>
            <p className="font-ar text-sm">
              {lifecycleLabel(item.status)}
              {item.requiresAck ? " · محتاج تأكيد" : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatWhen(item.createdAt)} · {categoryLabel(item.category)}
            </p>
          </section>

          {item.relatedObjects && item.relatedObjects.length > 0 ? (
            <section className="space-y-2">
              <h3 className="font-ar text-xs font-medium text-muted-foreground">
                مرتبط بـ
              </h3>
              <ul className="space-y-1.5">
                {item.relatedObjects.map((rel) => (
                  <li key={rel.href}>
                    <Link
                      href={rel.href}
                      className="font-ar inline-flex min-h-9 items-center text-sm text-soda-pink hover:underline"
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
              إجراءات
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                nativeButton={false}
                render={<Link href={href} onClick={() => live.markRead(item.id)} />}
                size="sm"
                className="min-h-9 cursor-pointer bg-soda-pink text-soda-action-foreground hover:bg-soda-pink/90"
              >
                افتح
              </Button>
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
                    className="min-h-9 cursor-pointer"
                  >
                    {a.label}
                  </Button>
                ))}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="min-h-9 cursor-pointer"
                onClick={() => {
                  live.dismiss(item.id);
                  onOpenChange(false);
                }}
              >
                تجاهل
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="min-h-9 cursor-pointer"
                onClick={() => {
                  live.archive(item.id);
                  onOpenChange(false);
                }}
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
            <ol className="space-y-2 border-s border-border/70 ps-3">
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
                    {h.note ?? lifecycleLabel(
                      h.status === "archived" || h.status === "dismissed"
                        ? "completed"
                        : h.status
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatWhen(h.at)}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function NotificationCenter({ subtitle }: { subtitle: string }) {
  const live = useNotificationLive();
  const [category, setCategory] = useState<NotificationCategory | "all">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(() => {
    return live.items.filter((n) => {
      if (category !== "all" && n.category !== category) return false;
      if (unreadOnly && n.status !== "unread") return false;
      return true;
    });
  }, [live.items, category, unreadOnly]);

  const groups = useMemo(
    () => groupNotificationsByTimeline(filtered),
    [filtered]
  );

  const selected = useMemo(
    () => live.items.find((n) => n.id === selectedId) ?? null,
    [live.items, selectedId]
  );

  function openItem(item: NotificationRecord) {
    setSelectedId(item.id);
    setDrawerOpen(true);
    if (item.status === "unread") live.markRead(item.id);
  }

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-ar text-xl font-semibold tracking-tight">
            مركز التنبيهات
          </h1>
          <p className="font-ar mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className="h-7 bg-soda-pink/15 px-2.5 font-ar text-soda-pink"
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
            disabled={checked.size === 0}
            onClick={() => {
              live.markRead([...checked]);
              setChecked(new Set());
            }}
          >
            اقرأ المحدد
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-9 cursor-pointer gap-1.5"
            disabled={checked.size === 0}
            onClick={() => {
              for (const id of checked) live.archive(id);
              setChecked(new Set());
            }}
          >
            <Archive className="size-3.5" />
            أرشيف
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-9 cursor-pointer gap-1.5"
            disabled={checked.size === 0}
            onClick={() => {
              for (const id of checked) live.dismiss(id);
              setChecked(new Set());
            }}
          >
            <Trash2 className="size-3.5" />
            تجاهل
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="size-3.5 text-muted-foreground" />
        <button
          type="button"
          onClick={() => setUnreadOnly((v) => !v)}
          className={cn(
            "font-ar min-h-8 cursor-pointer rounded-md px-2.5 text-xs transition-colors",
            unreadOnly
              ? "bg-soda-pink text-soda-action-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          غير مقروء
        </button>
        {CATEGORY_FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategory(key)}
            className={cn(
              "font-ar min-h-8 cursor-pointer rounded-md px-2.5 text-xs transition-colors",
              category === key
                ? "bg-foreground text-background"
                : "bg-muted/70 text-muted-foreground hover:text-foreground"
            )}
          >
            {key === "all" ? "الكل" : NOTIFICATION_CATEGORY_LABELS[key]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-12 text-center">
          <p className="font-ar text-sm text-muted-foreground">
            مفيش تنبيهات في الفلتر ده دلوقتي.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.key} className="space-y-2">
              <h2 className="font-ar sticky top-0 z-[1] bg-background/80 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                {group.label}
              </h2>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    selected={selectedId === item.id}
                    checked={checked.has(item.id)}
                    onToggleCheck={() => toggleCheck(item.id)}
                    onOpen={() => openItem(item)}
                    onMarkRead={() => live.markRead(item.id)}
                    onArchive={() => live.archive(item.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="font-ar text-[11px] text-muted-foreground md:hidden">
        اسحب يمين = اتقراء · شمال = أرشيف · اضغط = افتح التفاصيل
      </p>

      <DetailDrawer
        item={selected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
