"use client";

/**
 * Operations Desk — Understanding Panel.
 * Intent · Confidence · Entities · Status DRAFT · Questions · missing fields.
 * Approve disabled until canApprove. Execute only after Approve.
 * Never silent ERP.
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
  ExecuteTarget,
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
  onApprove: () => void;
  onExecute: () => void;
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

const INTENT_AR: Record<string, string> = {
  money_memory: "ذاكرة مال",
  potential_order: "أوردر محتمل",
  create_client: "إنشاء عميل",
  create_order: "إنشاء أوردر",
  reminder: "تذكير",
  idea: "فكرة",
  client_note: "ملاحظة عميل",
  meeting_note: "اجتماع",
  decision: "قرار",
  future_plan: "خطة",
  general_note: "ملاحظة",
};

const LIFECYCLE_AR: Record<string, string> = {
  draft: "مسودة",
  approved: "موافق",
  executed: "اتنفّذ",
  cancelled: "ملغي",
};

export function UnderstandingPanel({
  understanding: u,
  ar,
  pending,
  onChange,
  onApprove,
  onExecute,
  onCancel,
}: Props) {
  const labels = ar ? WORKSPACE_LABELS_AR : WORKSPACE_LABELS_EN;
  const confPct = Math.round(u.confidence * 100);
  const summary = ar ? u.founderSummaryAr : u.founderSummaryEn;
  const approved = u.lifecycle === "approved";
  const executed = u.lifecycle === "executed";

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
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-violet-300/70">
            {ar ? "فهم العمليات" : "Ops Understanding"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-violet-50/95">
            {summary}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-medium tabular-nums",
              confPct >= 70
                ? "bg-emerald-500/15 text-emerald-200"
                : confPct >= 45
                  ? "bg-amber-500/15 text-amber-100"
                  : "bg-violet-500/20 text-violet-200"
            )}
          >
            {confPct}%
          </span>
          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-100/90">
            {ar
              ? LIFECYCLE_AR[u.lifecycle] ?? u.lifecycle
              : u.lifecycle.toUpperCase()}
          </span>
        </div>
      </header>

      <div className="mb-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg border border-violet-500/20 bg-violet-950/40 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wider text-violet-400/55">
            {ar ? "النية" : "Intent"}
          </p>
          <p className="mt-0.5 font-medium text-violet-100">
            {ar ? INTENT_AR[u.intent] ?? u.intent : u.intent}
          </p>
        </div>
        <div className="rounded-lg border border-violet-500/20 bg-violet-950/40 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wider text-violet-400/55">
            {ar ? "التنفيذ" : "Execute to"}
          </p>
          <select
            value={u.executeTarget}
            disabled={approved || executed || pending}
            onChange={(e) =>
              field("executeTarget", e.target.value as ExecuteTarget)
            }
            className="mt-0.5 w-full bg-transparent text-violet-100 outline-none"
          >
            <option value="brain_save">
              {ar ? "الدماغ فقط" : "Brain only"}
            </option>
            <option value="erp_create_client">
              {ar ? "عميل ERP" : "ERP client"}
            </option>
            <option value="erp_create_order">
              {ar ? "أوردر ERP" : "ERP order"}
            </option>
          </select>
        </div>
      </div>

      {u.entities.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {u.entities.map((e, i) => (
            <span
              key={`${e.kind}-${e.label}-${i}`}
              className="rounded-md border border-violet-500/20 bg-violet-900/40 px-2 py-0.5 text-[10px] text-violet-200/85"
            >
              <span className="text-violet-400/55">{e.kind}</span> {e.label}
            </span>
          ))}
        </div>
      ) : null}

      {u.missingFields.length > 0 ? (
        <div className="mb-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2.5 py-2 text-[11px] text-amber-100/90">
          <p className="font-medium">
            {ar ? "ناقص:" : "Missing:"} {u.missingFields.join(" · ")}
          </p>
          {u.nextQuestionAr ? (
            <p className="mt-1 text-amber-50/95">
              {ar ? u.nextQuestionAr : u.nextQuestionEn}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mb-3 text-[11px] text-emerald-200/80">
          {ar
            ? "البيانات كافية — تقدر توافق."
            : "Enough data — you can Approve."}
        </p>
      )}

      {u.erpAwareness.length > 0 ? (
        <div className="mb-3 space-y-1.5 rounded-lg border border-violet-500/20 bg-violet-950/35 px-2.5 py-2">
          <p className="text-[9px] uppercase tracking-wider text-violet-400/55">
            {ar ? "وعي ERP (قراءة فقط)" : "ERP awareness (read-only)"}
          </p>
          {u.erpAwareness.map((h) => (
            <p key={h.clientId} className="text-[11px] text-violet-100/85">
              {ar ? h.noteAr : h.noteEn}
            </p>
          ))}
        </div>
      ) : null}

      <div className="space-y-2.5 text-xs">
        <label className="block space-y-1">
          <span className="text-violet-300/60">{ar ? "المساحة" : "Workspace"}</span>
          <select
            value={u.workspace}
            disabled={approved || executed}
            onChange={(e) =>
              field("workspace", e.target.value as BrainWorkspace)
            }
            className="w-full rounded-lg border border-violet-500/25 bg-violet-950/50 px-2.5 py-2 text-violet-50 outline-none focus:border-violet-400/50 disabled:opacity-60"
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
                disabled={approved || executed}
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
                disabled={approved || executed}
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
              disabled={approved || executed}
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
              disabled={approved || executed}
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
            disabled={approved || executed}
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
            disabled={approved || executed}
            value={u.companyLabel ?? ""}
            onChange={(e) => field("companyLabel", e.target.value || null)}
            className="border-violet-500/25 bg-violet-950/50 text-violet-50"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-violet-300/60">{ar ? "موبايل" : "Phone"}</span>
          <Input
            disabled={approved || executed}
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
                disabled={approved || executed}
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
                disabled={approved || executed}
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
            disabled={approved || executed}
            value={u.title ?? ""}
            onChange={(e) => field("title", e.target.value || null)}
            className="border-violet-500/25 bg-violet-950/50 text-violet-50"
          />
        </label>
      </div>

      {u.potentialActions.length > 0 ? (
        <ul className="mt-3 space-y-1 text-[10px] text-violet-400/60">
          {u.potentialActions.map((a) => (
            <li key={a.id}>
              {a.recommended ? "→ " : "· "}
              {ar ? a.labelAr : a.labelEn}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="mt-3 text-[10px] leading-relaxed text-violet-400/55">
        {ar
          ? "مرحلة أ: فهم · مرحلة ب: تنفيذ بعد الموافقة. صفر كتابة ERP صامتة."
          : "Phase A: understand · Phase B: execute after Approve. Zero silent ERP writes."}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending || executed || approved || !u.canApprove}
          onClick={onApprove}
          className="flex-1 rounded-xl bg-violet-600/90 text-white hover:bg-violet-500 disabled:opacity-40"
        >
          {ar ? "موافقة" : "Approve"}
        </Button>
        <Button
          type="button"
          disabled={pending || executed || !approved}
          onClick={onExecute}
          className="flex-1 rounded-xl bg-emerald-600/90 text-white hover:bg-emerald-500 disabled:opacity-40"
        >
          {ar ? "تنفيذ" : "Execute"}
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
