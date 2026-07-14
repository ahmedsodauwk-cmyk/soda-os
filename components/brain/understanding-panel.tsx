"use client";

/**
 * Smart Understanding — Founder-facing confirmation panel.
 * No Intent / Confidence / Parser / Draft Status jargon.
 * Soft field edits + احفظ في Brain / نفذ في النظام.
 */

import {
  CURRENCIES,
  MONEY_KINDS,
  MONEY_DIRECTIONS,
  MONEY_KIND_LABELS_EN,
  type BrainCurrency,
  type MoneyDirection,
  type MoneyKind,
} from "@/lib/brain/types";
import type {
  BrainUnderstanding,
  UnderstandingEdits,
} from "@/lib/brain/intelligence/types";
import { buildUnderstandingBullets } from "@/lib/brain/intelligence/summary";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  understanding: BrainUnderstanding;
  ar: boolean;
  pending?: boolean;
  onChange: (edits: UnderstandingEdits) => void;
  onBrainSave: () => void;
  onSystemExecute: () => void;
  onCancel: () => void;
  onClose?: () => void;
  canSystemExecute: boolean;
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
  onBrainSave,
  onSystemExecute,
  onCancel,
  onClose,
  canSystemExecute,
}: Props) {
  const bullets = buildUnderstandingBullets(u);
  const lines = ar ? bullets.ar : bullets.en;
  const approved = u.lifecycle === "approved";
  const executed = u.lifecycle === "executed";
  const locked = approved || executed || pending;

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
        <div className="min-w-0">
          <p className="text-[10px] font-medium tracking-[0.08em] text-violet-300/70">
            {ar ? "فهم ذكي" : "Smart Understanding"}
          </p>
          <p className="mt-1.5 text-sm font-medium text-violet-50/95">
            {ar ? "أنا فهمت إن:" : "Here's what I got:"}
          </p>
          <ul className="mt-2 space-y-1">
            {lines.map((line) => (
              <li
                key={line}
                className="text-sm leading-relaxed text-violet-100/90"
              >
                ✓ {line}
              </li>
            ))}
          </ul>
          {u.canApprove ? (
            <p className="mt-2 text-sm text-emerald-200/85">
              {ar ? "هل فهمي صح؟" : "Did I get that right?"}
            </p>
          ) : u.nextQuestionAr ? (
            <p className="mt-2 text-sm text-amber-100/90">
              {ar ? u.nextQuestionAr : u.nextQuestionEn}
            </p>
          ) : null}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md px-2 py-1 text-[11px] text-violet-300/60 hover:bg-violet-500/15 hover:text-violet-100"
          >
            {ar ? "إخفاء" : "Hide"}
          </button>
        ) : null}
      </header>

      <div className="space-y-2.5 text-xs">
        {u.workspace === "money_memory" ? (
          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className="text-violet-300/60">
                {ar ? "نوع الفلوس" : "Money kind"}
              </span>
              <select
                value={u.moneyKind ?? ""}
                disabled={locked}
                onChange={(e) =>
                  field(
                    "moneyKind",
                    (e.target.value || null) as MoneyKind | null
                  )
                }
                className="w-full rounded-lg border border-violet-500/25 bg-violet-950/50 px-2.5 py-2 text-violet-50 outline-none disabled:opacity-60"
              >
                <option value="">—</option>
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
                disabled={locked}
                onChange={(e) =>
                  field(
                    "moneyDirection",
                    (e.target.value || null) as MoneyDirection | null
                  )
                }
                className="w-full rounded-lg border border-violet-500/25 bg-violet-950/50 px-2.5 py-2 text-violet-50 outline-none disabled:opacity-60"
              >
                <option value="">—</option>
                {MONEY_DIRECTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d === "in"
                      ? ar
                        ? "داخلة"
                        : "in"
                      : d === "out"
                        ? ar
                          ? "خارجة"
                          : "out"
                        : d}
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
              disabled={locked}
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
              disabled={locked}
              onChange={(e) =>
                field("currency", e.target.value as BrainCurrency)
              }
              className="w-full rounded-lg border border-violet-500/25 bg-violet-950/50 px-2.5 py-2 text-violet-50 outline-none disabled:opacity-60"
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
          <span className="text-violet-300/60">{ar ? "شخص" : "Person"}</span>
          <Input
            disabled={locked}
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
            disabled={locked}
            value={u.companyLabel ?? ""}
            onChange={(e) => field("companyLabel", e.target.value || null)}
            className="border-violet-500/25 bg-violet-950/50 text-violet-50"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-violet-300/60">{ar ? "موبايل" : "Phone"}</span>
          <Input
            disabled={locked}
            value={u.phone ?? ""}
            onChange={(e) => field("phone", e.target.value || null)}
            className="border-violet-500/25 bg-violet-950/50 text-violet-50"
          />
        </label>
        {(u.executeTarget === "erp_create_order" ||
          u.intent === "create_order") && (
          <div className="grid grid-cols-2 gap-2">
            <label className="block space-y-1">
              <span className="text-violet-300/60">
                {ar ? "تاريخ التصوير" : "Shoot date"}
              </span>
              <Input
                disabled={locked}
                value={u.shootDate ?? ""}
                onChange={(e) => field("shootDate", e.target.value || null)}
                placeholder="YYYY-MM-DD"
                className="border-violet-500/25 bg-violet-950/50 text-violet-50"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-violet-300/60">
                {ar ? "نوع الشغل" : "Project type"}
              </span>
              <Input
                disabled={locked}
                value={u.projectType ?? ""}
                onChange={(e) => field("projectType", e.target.value || null)}
                className="border-violet-500/25 bg-violet-950/50 text-violet-50"
              />
            </label>
          </div>
        )}
        <label className="block space-y-1">
          <span className="text-violet-300/60">{ar ? "عنوان" : "Title"}</span>
          <Input
            disabled={locked}
            value={u.title ?? ""}
            onChange={(e) => field("title", e.target.value || null)}
            className="border-violet-500/25 bg-violet-950/50 text-violet-50"
          />
        </label>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-violet-400/55">
        {ar
          ? "مفيش حاجة بتتسجل في النظام غير لما تضغط نفذ في النظام."
          : "Nothing hits the system until you press Run in system."}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending || executed || !u.canApprove}
          onClick={onBrainSave}
          className="flex-1 rounded-xl bg-violet-600/90 text-white hover:bg-violet-500 disabled:opacity-40"
        >
          {ar ? "احفظ في Brain" : "Save to Brain"}
        </Button>
        <Button
          type="button"
          disabled={
            pending || executed || !u.canApprove || !canSystemExecute
          }
          onClick={onSystemExecute}
          className="flex-1 rounded-xl bg-emerald-600/90 text-white hover:bg-emerald-500 disabled:opacity-40"
        >
          {ar ? "نفذ في النظام" : "Run in system"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending || executed}
          onClick={onCancel}
          className="rounded-xl text-violet-200/80 hover:bg-violet-500/15 hover:text-violet-50"
        >
          {ar ? "إلغاء" : "Cancel"}
        </Button>
      </div>
    </section>
  );
}
