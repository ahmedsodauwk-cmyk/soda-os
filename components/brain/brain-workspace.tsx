"use client";

/**
 * SODA Brain — Founder Intelligence Workspace UI.
 * Calm second-brain layer (not ERP chrome). No auto CRM / Finance / Orders.
 */

import { useMemo, useState, useTransition } from "react";
import {
  Brain,
  Inbox,
  Wallet,
  Lightbulb,
  Users,
  Sparkles,
  Bell,
  Plus,
  Search,
  Clock,
  Trash2,
  X,
} from "lucide-react";

import {
  createBrainEntryAction,
  deleteBrainEntryAction,
  loadBrainHistoryAction,
  updateBrainEntryAction,
} from "@/lib/brain/actions";
import type {
  BrainEntry,
  BrainHistoryRow,
  BrainWorkspace,
  MoneyKind,
} from "@/lib/brain/types";
import {
  BRAIN_WORKSPACES,
  MONEY_KINDS,
  MONEY_STATUSES,
  POTENTIAL_ORDER_STATUSES,
  REMINDER_STATUSES,
  WORKSPACE_LABELS_AR,
  WORKSPACE_LABELS_EN,
  defaultStatusForWorkspace,
} from "@/lib/brain/types";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const WORKSPACE_ICONS: Record<
  BrainWorkspace,
  React.ComponentType<{ className?: string }>
> = {
  inbox: Inbox,
  money_memory: Wallet,
  potential_orders: Sparkles,
  client_notebook: Users,
  ideas: Lightbulb,
  reminders: Bell,
};

type Props = {
  initialEntries: BrainEntry[];
  migrationHint?: string | null;
};

function formatWhen(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusesFor(workspace: BrainWorkspace): readonly string[] | null {
  switch (workspace) {
    case "money_memory":
      return MONEY_STATUSES;
    case "potential_orders":
      return POTENTIAL_ORDER_STATUSES;
    case "reminders":
      return REMINDER_STATUSES;
    default:
      return null;
  }
}

export function BrainWorkspace({ initialEntries, migrationHint }: Props) {
  const { locale, t } = useI18n();
  const [entries, setEntries] = useState(initialEntries);
  const [workspace, setWorkspace] = useState<BrainWorkspace>("inbox");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<BrainHistoryRow[]>([]);
  const [composing, setComposing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Compose draft
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<string | null>(
    defaultStatusForWorkspace("inbox")
  );
  const [confidence, setConfidence] = useState(40);
  const [clientLabel, setClientLabel] = useState("");
  const [moneyKind, setMoneyKind] = useState<MoneyKind | "">("");
  const [amountNote, setAmountNote] = useState("");
  const [dueAt, setDueAt] = useState("");

  const labels = locale === "ar" ? WORKSPACE_LABELS_AR : WORKSPACE_LABELS_EN;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (!q && e.workspace !== workspace) return false;
      if (q) {
        const hay = [
          e.title,
          e.body,
          e.clientLabel,
          e.amountNote,
          e.status,
          e.workspace,
          e.tags.join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      } else if (e.workspace !== workspace) {
        return false;
      }
      return true;
    });
  }, [entries, search, workspace]);

  const selected = selectedId
    ? entries.find((e) => e.id === selectedId) ?? null
    : null;

  function resetDraft(nextWs: BrainWorkspace = workspace) {
    setTitle("");
    setBody("");
    setStatus(defaultStatusForWorkspace(nextWs));
    setConfidence(40);
    setClientLabel("");
    setMoneyKind("");
    setAmountNote("");
    setDueAt("");
  }

  function openCompose() {
    resetDraft(workspace);
    setComposing(true);
    setSelectedId(null);
    setHistory([]);
    setError(null);
  }

  function selectEntry(entry: BrainEntry) {
    setSelectedId(entry.id);
    setComposing(false);
    setError(null);
    startTransition(async () => {
      const res = await loadBrainHistoryAction(entry.id);
      if (res.ok && res.history) setHistory(res.history);
      else setHistory([]);
    });
  }

  function switchWorkspace(ws: BrainWorkspace) {
    setWorkspace(ws);
    setSearch("");
    setSelectedId(null);
    setHistory([]);
    setComposing(false);
    resetDraft(ws);
  }

  function handleCreate() {
    if (!body.trim() && !title.trim()) {
      setError(locale === "ar" ? "اكتب حاجة الأول." : "Write something first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createBrainEntryAction({
        workspace,
        title: title.trim() || null,
        body: body.trim(),
        status: status,
        confidence: workspace === "potential_orders" ? confidence : null,
        clientLabel:
          workspace === "client_notebook" ? clientLabel.trim() || null : null,
        moneyKind:
          workspace === "money_memory" && moneyKind ? moneyKind : null,
        amountNote:
          workspace === "money_memory" ? amountNote.trim() || null : null,
        dueAt: workspace === "reminders" && dueAt ? dueAt : null,
      });
      if (!res.ok || !res.entry) {
        setError(res.error ?? "Failed");
        return;
      }
      setEntries((prev) => [res.entry!, ...prev.filter((e) => e.id !== res.entry!.id)]);
      setComposing(false);
      resetDraft();
      selectEntry(res.entry);
    });
  }

  function handleUpdateField(patch: {
    title?: string | null;
    body?: string;
    status?: string | null;
    confidence?: number | null;
    clientLabel?: string | null;
    moneyKind?: MoneyKind | null;
    amountNote?: string | null;
    dueAt?: string | null;
  }) {
    if (!selected) return;
    startTransition(async () => {
      const res = await updateBrainEntryAction(selected.id, patch);
      if (!res.ok || !res.entry) {
        setError(res.error ?? "Failed");
        return;
      }
      setEntries((prev) =>
        prev.map((e) => (e.id === res.entry!.id ? res.entry! : e))
      );
      const hist = await loadBrainHistoryAction(selected.id);
      if (hist.ok && hist.history) setHistory(hist.history);
    });
  }

  function handleDelete(id: string) {
    if (
      !confirm(
        locale === "ar"
          ? "نمسح الملاحظة دي من الدماغ؟"
          : "Delete this Brain note?"
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await deleteBrainEntryAction(id);
      if (!res.ok) {
        setError(res.error ?? "Failed");
        return;
      }
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setSelectedId(null);
      setHistory([]);
    });
  }

  const statusOptions = statusesFor(workspace);

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-violet-500/20 bg-[linear-gradient(165deg,rgba(41,25,74,0.35)_0%,rgba(12,10,20,0.92)_40%,rgba(18,14,28,0.98)_100%)] text-violet-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.18),transparent_55%)]"
        aria-hidden
      />

      <div className="relative flex flex-col gap-0 lg:flex-row lg:min-h-[640px]">
        {/* Rail */}
        <aside className="flex shrink-0 flex-col border-b border-violet-500/15 lg:w-56 lg:border-b-0 lg:border-e lg:border-violet-500/15">
          <div className="flex items-center gap-2.5 px-4 py-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500/20 text-lg">
              🧠
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium tracking-tight text-violet-50">
                SODA Brain
              </p>
              <p className="truncate text-[11px] text-violet-300/70">
                {locale === "ar" ? "مؤسس فقط · خاص" : "Founder only · private"}
              </p>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto px-2 pb-3 lg:flex-col lg:overflow-visible lg:px-2">
            {BRAIN_WORKSPACES.map((ws) => {
              const Icon = WORKSPACE_ICONS[ws];
              const active = workspace === ws && !search.trim();
              const count = entries.filter((e) => e.workspace === ws).length;
              return (
                <button
                  key={ws}
                  type="button"
                  onClick={() => switchWorkspace(ws)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    active
                      ? "bg-violet-500/25 text-violet-50"
                      : "text-violet-200/65 hover:bg-violet-500/10 hover:text-violet-100"
                  )}
                >
                  <Icon className="size-3.5 shrink-0 opacity-80" />
                  <span className="truncate">{labels[ws]}</span>
                  {count > 0 ? (
                    <span className="ms-auto text-[10px] tabular-nums text-violet-300/50">
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <p className="mt-auto hidden px-4 py-3 text-[10px] leading-relaxed text-violet-400/50 lg:block">
            {locale === "ar"
              ? "مابيتلمسش الأوردرات ولا المالية ولا العملاء لوحده."
              : "Never touches Orders, Finance, or Clients on its own."}
          </p>
        </aside>

        {/* List + search */}
        <section className="flex min-w-0 flex-1 flex-col border-b border-violet-500/15 lg:border-b-0 lg:border-e lg:border-violet-500/15 lg:max-w-md">
          <div className="flex items-center gap-2 border-b border-violet-500/15 px-3 py-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-violet-400/50" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  locale === "ar"
                    ? "بحث في كل الدماغ…"
                    : "Search all of Brain…"
                }
                className="h-9 border-violet-500/20 bg-violet-950/40 ps-8 text-sm text-violet-50 placeholder:text-violet-400/40 focus-visible:border-violet-400/40 focus-visible:ring-violet-500/30"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={openCompose}
              className="h-9 shrink-0 gap-1 bg-violet-500/90 text-white hover:bg-violet-400"
            >
              <Plus className="size-3.5" />
              {locale === "ar" ? "جديد" : "New"}
            </Button>
          </div>

          {migrationHint ? (
            <p className="border-b border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
              {migrationHint}
            </p>
          ) : null}

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
                <Brain className="size-8 text-violet-400/40" />
                <p className="text-sm text-violet-200/70">
                  {search.trim()
                    ? locale === "ar"
                      ? "مفيش نتيجة."
                      : "Nothing matches."
                    : locale === "ar"
                      ? "فاضي لحد ما تكتب."
                      : "Empty until you write."}
                </p>
                {!search.trim() ? (
                  <button
                    type="button"
                    onClick={openCompose}
                    className="mt-1 text-xs text-violet-300 underline-offset-2 hover:underline"
                  >
                    {locale === "ar" ? "اكتب أول ملاحظة" : "Capture first note"}
                  </button>
                ) : null}
              </div>
            ) : (
              <ul className="divide-y divide-violet-500/10">
                {filtered.map((entry) => {
                  const active = entry.id === selectedId;
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => selectEntry(entry)}
                        className={cn(
                          "flex w-full flex-col gap-1 px-3.5 py-3 text-start transition-colors",
                          active
                            ? "bg-violet-500/20"
                            : "hover:bg-violet-500/10"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-1 text-sm font-medium text-violet-50">
                            {entry.title ||
                              entry.body.slice(0, 60) ||
                              (locale === "ar" ? "بدون عنوان" : "Untitled")}
                          </p>
                          {search.trim() ? (
                            <span className="shrink-0 text-[10px] text-violet-400/60">
                              {labels[entry.workspace]}
                            </span>
                          ) : null}
                        </div>
                        {entry.body && entry.title ? (
                          <p className="line-clamp-2 text-xs text-violet-300/55">
                            {entry.body}
                          </p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-violet-400/50">
                          {entry.status ? (
                            <span className="rounded bg-violet-500/15 px-1.5 py-0.5 text-violet-200/80">
                              {entry.status}
                            </span>
                          ) : null}
                          {entry.confidence != null ? (
                            <span>{entry.confidence}%</span>
                          ) : null}
                          <span className="ms-auto flex items-center gap-1">
                            <Clock className="size-2.5" />
                            {formatWhen(entry.updatedAt, locale)}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Detail / compose */}
        <section className="relative flex min-h-[340px] min-w-0 flex-[1.4] flex-col">
          {error ? (
            <p className="border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-xs text-red-100">
              {error}
            </p>
          ) : null}

          {composing ? (
            <div className="flex flex-1 flex-col gap-3 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs tracking-wide text-violet-300/70 uppercase">
                  {locale === "ar" ? "كتابة حرة" : "Free capture"} ·{" "}
                  {labels[workspace]}
                </p>
                <button
                  type="button"
                  onClick={() => setComposing(false)}
                  className="rounded-md p-1 text-violet-300/60 hover:bg-violet-500/15 hover:text-violet-100"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>

              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={locale === "ar" ? "عنوان (اختياري)" : "Title (optional)"}
                className="border-0 border-b border-violet-500/20 bg-transparent px-0 text-lg text-violet-50 shadow-none placeholder:text-violet-400/35 focus-visible:border-violet-400/40 focus-visible:ring-0"
              />

              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  locale === "ar"
                    ? "اكتب… مفيش ضغط. ده دماغك."
                    : "Write freely… this is your brain."
                }
                rows={10}
                className="min-h-[200px] flex-1 resize-none border-0 bg-transparent px-0 text-sm leading-relaxed text-violet-100/90 shadow-none placeholder:text-violet-400/35 focus-visible:ring-0"
              />

              <div className="flex flex-wrap gap-3 border-t border-violet-500/15 pt-3">
                {statusOptions ? (
                  <label className="flex flex-col gap-1 text-[10px] text-violet-400/70">
                    Status
                    <select
                      value={status ?? ""}
                      onChange={(e) => setStatus(e.target.value || null)}
                      className="h-8 rounded-md border border-violet-500/25 bg-violet-950/50 px-2 text-xs text-violet-100"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {workspace === "potential_orders" ? (
                  <label className="flex flex-col gap-1 text-[10px] text-violet-400/70">
                    Confidence {confidence}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={confidence}
                      onChange={(e) => setConfidence(Number(e.target.value))}
                      className="w-36 accent-violet-400"
                    />
                  </label>
                ) : null}

                {workspace === "client_notebook" ? (
                  <label className="flex flex-col gap-1 text-[10px] text-violet-400/70">
                    {locale === "ar" ? "اسم / لابل" : "Person label"}
                    <Input
                      value={clientLabel}
                      onChange={(e) => setClientLabel(e.target.value)}
                      placeholder={
                        locale === "ar"
                          ? "مش مربوط بالـ CRM"
                          : "Not linked to CRM"
                      }
                      className="h-8 w-44 border-violet-500/25 bg-violet-950/50 text-xs text-violet-100"
                    />
                  </label>
                ) : null}

                {workspace === "money_memory" ? (
                  <>
                    <label className="flex flex-col gap-1 text-[10px] text-violet-400/70">
                      Kind
                      <select
                        value={moneyKind}
                        onChange={(e) =>
                          setMoneyKind((e.target.value as MoneyKind) || "")
                        }
                        className="h-8 rounded-md border border-violet-500/25 bg-violet-950/50 px-2 text-xs text-violet-100"
                      >
                        <option value="">—</option>
                        {MONEY_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-[10px] text-violet-400/70">
                      {locale === "ar" ? "مبلغ / ملاحظة" : "Amount note"}
                      <Input
                        value={amountNote}
                        onChange={(e) => setAmountNote(e.target.value)}
                        placeholder="e.g. 5k — unofficial"
                        className="h-8 w-44 border-violet-500/25 bg-violet-950/50 text-xs text-violet-100"
                      />
                    </label>
                  </>
                ) : null}

                {workspace === "reminders" ? (
                  <label className="flex flex-col gap-1 text-[10px] text-violet-400/70">
                    Due
                    <Input
                      type="datetime-local"
                      value={dueAt}
                      onChange={(e) => setDueAt(e.target.value)}
                      className="h-8 border-violet-500/25 bg-violet-950/50 text-xs text-violet-100"
                    />
                  </label>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-[10px] text-violet-400/45">
                  {locale === "ar"
                    ? "Promote → ERP: قريبًا"
                    : "Promote → ERP: coming later"}
                </p>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={handleCreate}
                  className="bg-violet-500 text-white hover:bg-violet-400"
                >
                  {pending
                    ? t("actions.saving")
                    : locale === "ar"
                      ? "حفظ في الدماغ"
                      : "Save to Brain"}
                </Button>
              </div>
            </div>
          ) : selected ? (
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="text-[10px] tracking-wide text-violet-400/60 uppercase">
                    {labels[selected.workspace]}
                  </p>
                  <Input
                    key={`title-${selected.id}`}
                    defaultValue={selected.title ?? ""}
                    onBlur={(e) => {
                      const next = e.target.value.trim() || null;
                      if (next !== selected.title) {
                        handleUpdateField({ title: next });
                      }
                    }}
                    placeholder={locale === "ar" ? "بدون عنوان" : "Untitled"}
                    className="border-0 bg-transparent px-0 text-xl font-medium text-violet-50 shadow-none focus-visible:ring-0"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => handleDelete(selected.id)}
                  className="shrink-0 text-violet-300/50 hover:bg-red-500/15 hover:text-red-200"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <Textarea
                key={`body-${selected.id}`}
                defaultValue={selected.body}
                onBlur={(e) => {
                  if (e.target.value !== selected.body) {
                    handleUpdateField({ body: e.target.value });
                  }
                }}
                rows={8}
                className="min-h-[160px] resize-none border-0 bg-transparent px-0 text-sm leading-relaxed text-violet-100/90 shadow-none focus-visible:ring-0"
              />

              <div className="flex flex-wrap gap-3">
                {statusesFor(selected.workspace) ? (
                  <label className="flex flex-col gap-1 text-[10px] text-violet-400/70">
                    Status
                    <select
                      value={selected.status ?? ""}
                      onChange={(e) =>
                        handleUpdateField({ status: e.target.value || null })
                      }
                      className="h-8 rounded-md border border-violet-500/25 bg-violet-950/50 px-2 text-xs text-violet-100"
                    >
                      {statusesFor(selected.workspace)!.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}

                {selected.workspace === "potential_orders" ? (
                  <label className="flex flex-col gap-1 text-[10px] text-violet-400/70">
                    Confidence {selected.confidence ?? 0}%
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={selected.confidence ?? 0}
                      onChange={(e) =>
                        handleUpdateField({
                          confidence: Number(e.target.value),
                        })
                      }
                      className="w-36 accent-violet-400"
                    />
                  </label>
                ) : null}

                {selected.workspace === "client_notebook" ? (
                  <label className="flex flex-col gap-1 text-[10px] text-violet-400/70">
                    {locale === "ar" ? "لابل" : "Label"}
                    <Input
                      key={`cl-${selected.id}`}
                      defaultValue={selected.clientLabel ?? ""}
                      onBlur={(e) => {
                        const next = e.target.value.trim() || null;
                        if (next !== selected.clientLabel) {
                          handleUpdateField({ clientLabel: next });
                        }
                      }}
                      className="h-8 w-44 border-violet-500/25 bg-violet-950/50 text-xs"
                    />
                  </label>
                ) : null}

                {selected.workspace === "money_memory" ? (
                  <>
                    <label className="flex flex-col gap-1 text-[10px] text-violet-400/70">
                      Kind
                      <select
                        value={selected.moneyKind ?? ""}
                        onChange={(e) =>
                          handleUpdateField({
                            moneyKind: (e.target.value as MoneyKind) || null,
                          })
                        }
                        className="h-8 rounded-md border border-violet-500/25 bg-violet-950/50 px-2 text-xs text-violet-100"
                      >
                        <option value="">—</option>
                        {MONEY_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-[10px] text-violet-400/70">
                      Amount note
                      <Input
                        key={`amt-${selected.id}`}
                        defaultValue={selected.amountNote ?? ""}
                        onBlur={(e) => {
                          const next = e.target.value.trim() || null;
                          if (next !== selected.amountNote) {
                            handleUpdateField({ amountNote: next });
                          }
                        }}
                        className="h-8 w-44 border-violet-500/25 bg-violet-950/50 text-xs"
                      />
                    </label>
                  </>
                ) : null}
              </div>

              <div className="mt-2 rounded-xl border border-violet-500/15 bg-violet-950/30 px-3 py-3">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] tracking-wide text-violet-300/60 uppercase">
                  <Clock className="size-3" />
                  {locale === "ar" ? "التايملاين" : "Timeline"}
                </p>
                <p className="mb-2 text-[11px] text-violet-400/55">
                  {locale === "ar" ? "اتكتب" : "Created"}{" "}
                  {formatWhen(selected.createdAt, locale)}
                  {" · "}
                  {locale === "ar" ? "اتحدّث" : "Updated"}{" "}
                  {formatWhen(selected.updatedAt, locale)}
                </p>
                {history.length === 0 ? (
                  <p className="text-xs text-violet-400/40">
                    {locale === "ar" ? "مفيش تاريخ لسه." : "No history yet."}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {history.map((h) => (
                      <li
                        key={h.id}
                        className="flex gap-2 text-xs text-violet-200/70"
                      >
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet-400/60" />
                        <div>
                          <p>
                            <span className="text-violet-100/90">{h.action}</span>
                            {h.note ? (
                              <span className="text-violet-400/70">
                                {" "}
                                · {h.note}
                              </span>
                            ) : null}
                          </p>
                          <p className="text-[10px] text-violet-400/45">
                            {formatWhen(h.changedAt, locale)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="text-[10px] text-violet-400/40">
                {locale === "ar"
                  ? "Promote Engine — قريبًا. مش بيحوّل لأوردر لوحده."
                  : "Promote Engine — coming later. Confirmed stays in Brain until you move it manually."}
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <span className="text-4xl opacity-40">🧠</span>
              <p className="max-w-sm text-sm text-violet-200/65">
                {locale === "ar"
                  ? "اختار ملاحظة، أو اكتب حاجة جديدة. الدماغ مش ERP."
                  : "Pick a note, or capture something new. This is not the ERP."}
              </p>
              <Button
                type="button"
                onClick={openCompose}
                className="mt-1 gap-1.5 bg-violet-500/90 text-white hover:bg-violet-400"
              >
                <Plus className="size-3.5" />
                {locale === "ar" ? "اكتب" : "Write"}
              </Button>
            </div>
          )}

          {pending ? (
            <div className="pointer-events-none absolute end-4 top-4 text-[10px] text-violet-300/50">
              …
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
