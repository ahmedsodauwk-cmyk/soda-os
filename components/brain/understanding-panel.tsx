"use client";

/**
 * Brain Understood — Founder edits before Save.
 * Nothing persisted until Save. Never ERP.
 */

import {
  BRAIN_WORKSPACES,
  CURRENCIES,
  MONEY_KINDS,
  MONEY_DIRECTIONS,
  WORKSPACE_LABELS_AR,
  WORKSPACE_LABELS_EN,
  MONEY_KIND_LABELS_EN,
  type BrainCurrency,
  type BrainWorkspace,
  type MoneyDirection,
  type MoneyKind,
} from "@/lib/brain/types";
import type {
  BrainUnderstanding,
  UnderstandingEdits,
} from "@/lib/brain/intelligence/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  understanding: BrainUnderstanding;
  ar: boolean;
  pending?: boolean;
  onChange: (edits: UnderstandingEdits) => void;
  onSave: () => void;
  onCancel: () => void;
};

const MONEY_KIND_AR: Record<MoneyKind, string> = {
  to_collect: "مستحق",
  lent: "سلفة مدفوعة",
  debt: "دين علينا",
  crew_advance: "سلفة طاقم",
  client_debt: "دين عميل",
  note: "ملاحظة",
};

export function UnderstandingPanel({
  understanding: u,
  ar,
  pending,
  onChange,
  onSave,
  onCancel,
}: Props) {
  const labels = ar ? WORKSPACE_LABELS_AR : WORKSPACE_LABELS_EN;
  const confPct = Math.round(u.confidence * 100);
  const summary = ar ? u.founderSummaryAr : u.founderSummaryEn;

  function field(
    key: keyof UnderstandingEdits,
    value: string | number | boolean | null
  ) {
    onChange({ [key]: value } as UnderstandingEdits);
  }

  return (
    <section
      className={cn(
        "rounded-xl border border-violet-400/25 bg-[linear-gradient(165deg,rgba(55,35,95,0.55)_0%,rgba(20,14,36,0.92)_100%)] p-3.5 shadow-[0_0_40px_-18px_rgba(139,92,246,0.45)]"
      )}
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-violet-300/70">
            {ar ? "الدماغ فهم" : "Brain Understood"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-violet-50/95">
            {summary}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-1 text-[11px] font-medium tabular-nums",
            confPct >= 70
              ? "bg-emerald-500/15 text-emerald-200"
              : confPct >= 45
                ? "bg-amber-500/15 text-amber-100"
                : "bg-violet-500/20 text-violet-200"
          )}
        >
          {confPct}%
        </span>
      </header>

      <div className="space-y-2.5 text-xs">
        <label className="block space-y-1">
          <span className="text-violet-300/60">{ar ? "المساحة" : "Workspace"}</span>
          <select
            value={u.workspace}
            onChange={(e) =>
              field("workspace", e.target.value as BrainWorkspace)
            }
            className="w-full rounded-lg border border-violet-500/25 bg-violet-950/50 px-2.5 py-2 text-violet-50 outline-none focus:border-violet-400/50"
          >
            {BRAIN_WORKSPACES.filter((w) => w !== "archive").map((w) => (
              <option key={w} value={w}>
                {labels[w]}
              </option>
            ))}
          </select>
        </label>

        {u.workspace === "money_memory" ? (
          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className="text-violet-300/60">
                {ar ? "نوع الفلوس" : "Money kind"}
              </span>
              <select
                value={u.moneyKind ?? ""}
                onChange={(e) =>
                  field(
                    "moneyKind",
                    (e.target.value || null) as MoneyKind | null
                  )
                }
                className="w-full rounded-lg border border-violet-500/25 bg-violet-950/50 px-2.5 py-2 text-violet-50 outline-none"
              >
                <option value="">{ar ? "—" : "—"}</option>
                {MONEY_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {ar ? MONEY_KIND_AR[k] : MONEY_KIND_LABELS_EN[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-violet-300/60">
                {ar ? "الاتجاه" : "Direction"}
              </span>
              <select
                value={u.moneyDirection ?? ""}
                onChange={(e) =>
                  field(
                    "moneyDirection",
                    (e.target.value || null) as MoneyDirection | null
                  )
                }
                className="w-full rounded-lg border border-violet-500/25 bg-violet-950/50 px-2.5 py-2 text-violet-50 outline-none"
              >
                <option value="">—</option>
                {MONEY_DIRECTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <label className="block space-y-1">
            <span className="text-violet-300/60">{ar ? "المبلغ" : "Amount"}</span>
            <Input
              type="number"
              value={u.amount ?? ""}
              onChange={(e) =>
                field(
                  "amount",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              className="border-violet-500/25 bg-violet-950/50 text-violet-50"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-violet-300/60">
              {ar ? "العملة" : "Currency"}
            </span>
            <select
              value={u.currency ?? "EGP"}
              onChange={(e) =>
                field("currency", e.target.value as BrainCurrency)
              }
              className="w-full rounded-lg border border-violet-500/25 bg-violet-950/50 px-2.5 py-2 text-violet-50 outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-violet-300/60">
            {ar ? "شخص" : "Person"}
          </span>
          <Input
            value={u.personLabel ?? ""}
            onChange={(e) => field("personLabel", e.target.value || null)}
            className="border-violet-500/25 bg-violet-950/50 text-violet-50"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-violet-300/60">
            {ar ? "شركة / جهة" : "Company"}
          </span>
          <Input
            value={u.companyLabel ?? ""}
            onChange={(e) => field("companyLabel", e.target.value || null)}
            className="border-violet-500/25 bg-violet-950/50 text-violet-50"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-violet-300/60">{ar ? "عنوان" : "Title"}</span>
          <Input
            value={u.title ?? ""}
            onChange={(e) => field("title", e.target.value || null)}
            className="border-violet-500/25 bg-violet-950/50 text-violet-50"
          />
        </label>
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-violet-400/55">
        {ar
          ? "مفيش تسجيل Structured غير لما تضغط حفظ. الدماغ فقط — صفر ERP."
          : "No structured save until you press Save. Brain only — zero ERP."}
      </p>

      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={onSave}
          className="flex-1 rounded-xl bg-violet-500 text-white hover:bg-violet-400"
        >
          {ar ? "حفظ" : "Save"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={onCancel}
          className="rounded-xl text-violet-200/80 hover:bg-violet-500/15 hover:text-violet-50"
        >
          {ar ? "إلغاء" : "Cancel"}
        </Button>
      </div>
    </section>
  );
}
