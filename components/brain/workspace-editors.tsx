"use client";

/**
 * Dedicated per-workspace editors — not one shared textbox.
 */

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ChipRow,
  CurrencyPicker,
  FieldLabel,
  PriorityChips,
  QuickAmountButtons,
  ReminderToggle,
} from "@/components/brain/smart-inputs";
import {
  MONEY_KINDS,
  MONEY_KIND_LABELS_EN,
  MONEY_DIRECTIONS,
  type BrainCurrency,
  type BrainPriority,
  type BrainWorkspace,
  type MoneyDirection,
  type MoneyKind,
  statusesForWorkspace,
} from "@/lib/brain/types";

export type EditorDraft = {
  title: string;
  body: string;
  status: string | null;
  confidence: number;
  clientLabel: string;
  personLabel: string;
  companyLabel: string;
  phone: string;
  budgetNote: string;
  moneyKind: MoneyKind | "";
  moneyDirection: MoneyDirection | "";
  amount: string;
  amountNote: string;
  currency: BrainCurrency;
  priority: BrainPriority | null;
  dueAt: string;
  reminderEnabled: boolean;
  attendees: string;
  decision: string;
  horizon: string;
};

export function emptyDraft(workspace: BrainWorkspace): EditorDraft {
  const statusDefault = (() => {
    switch (workspace) {
      case "money_memory":
        return "Pending";
      case "potential_orders":
        return "Thinking";
      case "reminders":
        return "Open";
      case "personal_decisions":
        return "Open";
      case "future_plans":
        return "Idea";
      default:
        return null;
    }
  })();

  return {
    title: "",
    body: "",
    status: statusDefault,
    confidence: 40,
    clientLabel: "",
    personLabel: "",
    companyLabel: "",
    phone: "",
    budgetNote: "",
    moneyKind: "",
    moneyDirection: "",
    amount: "",
    amountNote: "",
    currency: "EGP",
    priority: "normal",
    dueAt: "",
    reminderEnabled: workspace === "reminders",
    attendees: "",
    decision: "",
    horizon: "",
  };
}

type EditorProps = {
  workspace: BrainWorkspace;
  draft: EditorDraft;
  setDraft: (patch: Partial<EditorDraft>) => void;
  locale: string;
  personSuggestions?: string[];
  companySuggestions?: string[];
};

export function WorkspaceEditor({
  workspace,
  draft,
  setDraft,
  locale,
  personSuggestions = [],
  companySuggestions = [],
}: EditorProps) {
  const ar = locale === "ar";
  const statuses = statusesForWorkspace(workspace);

  switch (workspace) {
    case "money_memory":
      return (
        <EditorShell>
          <TitleField draft={draft} setDraft={setDraft} ar={ar} placeholder={ar ? "مين / إيه؟" : "Who / what?"} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel>{ar ? "النوع" : "Kind"}</FieldLabel>
              <ChipRow
                options={MONEY_KINDS}
                value={draft.moneyKind || null}
                onChange={(v) => setDraft({ moneyKind: (v as MoneyKind) || "" })}
                labels={MONEY_KIND_LABELS_EN}
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>{ar ? "الاتجاه" : "Direction"}</FieldLabel>
              <ChipRow
                options={MONEY_DIRECTIONS}
                value={draft.moneyDirection || null}
                onChange={(v) =>
                  setDraft({ moneyDirection: (v as MoneyDirection) || "" })
                }
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>{ar ? "العملة" : "Currency"}</FieldLabel>
            <CurrencyPicker
              value={draft.currency}
              onChange={(c) => setDraft({ currency: c })}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>{ar ? "المبلغ" : "Amount"}</FieldLabel>
            <Input
              type="number"
              value={draft.amount}
              onChange={(e) => setDraft({ amount: e.target.value })}
              className="h-9 border-violet-500/25 bg-violet-950/50 text-violet-50"
              placeholder="0"
            />
            <QuickAmountButtons
              onPick={(n) => setDraft({ amount: String(n), amountNote: String(n) })}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>{ar ? "شخص / جهة" : "Person"}</FieldLabel>
            <Input
              value={draft.personLabel}
              onChange={(e) => setDraft({ personLabel: e.target.value })}
              list="brain-person-suggestions"
              className="h-9 border-violet-500/25 bg-violet-950/50 text-violet-50"
              placeholder={ar ? "لابل حر — مش CRM" : "Free label — not CRM"}
            />
            <SuggestionList id="brain-person-suggestions" items={personSuggestions} />
          </div>
          {statuses ? (
            <div className="space-y-1.5">
              <FieldLabel>Status</FieldLabel>
              <ChipRow
                options={statuses}
                value={draft.status}
                onChange={(v) => setDraft({ status: v })}
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <FieldLabel>Priority</FieldLabel>
            <PriorityChips
              value={draft.priority}
              onChange={(p) => setDraft({ priority: p })}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>{ar ? "تاريخ التحصيل" : "Collect by"}</FieldLabel>
            <Input
              type="date"
              value={draft.dueAt}
              onChange={(e) => setDraft({ dueAt: e.target.value })}
              className="h-9 border-violet-500/25 bg-violet-950/50 text-violet-50"
            />
          </div>
          <ReminderToggle
            enabled={draft.reminderEnabled}
            onChange={(v) => setDraft({ reminderEnabled: v })}
            label={ar ? "تذكير" : "Reminder"}
          />
          <NotesField draft={draft} setDraft={setDraft} ar={ar} rows={5} />
        </EditorShell>
      );

    case "potential_orders":
      return (
        <EditorShell>
          <TitleField draft={draft} setDraft={setDraft} ar={ar} placeholder={ar ? "الأوردر المحتمل" : "Potential order"} />
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput
              label={ar ? "العميل (لابل)" : "Client label"}
              value={draft.clientLabel}
              onChange={(v) => setDraft({ clientLabel: v, personLabel: v })}
              list="brain-person-suggestions"
              placeholder={ar ? "مش مربوط بـ CRM" : "Not linked to CRM"}
            />
            <LabeledInput
              label={ar ? "شركة" : "Company"}
              value={draft.companyLabel}
              onChange={(v) => setDraft({ companyLabel: v })}
              list="brain-company-suggestions"
            />
            <LabeledInput
              label={ar ? "موبايل" : "Phone"}
              value={draft.phone}
              onChange={(v) => setDraft({ phone: v })}
            />
            <LabeledInput
              label={ar ? "باджет" : "Budget note"}
              value={draft.budgetNote}
              onChange={(v) => setDraft({ budgetNote: v })}
            />
          </div>
          <SuggestionList id="brain-person-suggestions" items={personSuggestions} />
          <SuggestionList id="brain-company-suggestions" items={companySuggestions} />
          <div className="space-y-1.5">
            <FieldLabel>Confidence {draft.confidence}%</FieldLabel>
            <input
              type="range"
              min={0}
              max={100}
              value={draft.confidence}
              onChange={(e) => setDraft({ confidence: Number(e.target.value) })}
              className="w-full accent-violet-400"
            />
          </div>
          {statuses ? (
            <div className="space-y-1.5">
              <FieldLabel>Status</FieldLabel>
              <ChipRow
                options={statuses}
                value={draft.status}
                onChange={(v) => setDraft({ status: v })}
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <FieldLabel>Priority</FieldLabel>
            <PriorityChips
              value={draft.priority}
              onChange={(p) => setDraft({ priority: p })}
            />
          </div>
          <NotesField draft={draft} setDraft={setDraft} ar={ar} rows={6} />
        </EditorShell>
      );

    case "client_notebook":
      return (
        <EditorShell>
          <TitleField draft={draft} setDraft={setDraft} ar={ar} placeholder={ar ? "ملاحظة علاقة" : "Relationship note"} />
          <LabeledInput
            label={ar ? "شخص" : "Person"}
            value={draft.personLabel || draft.clientLabel}
            onChange={(v) => setDraft({ personLabel: v, clientLabel: v })}
            list="brain-person-suggestions"
            placeholder={ar ? "لابل حر" : "Free label"}
          />
          <LabeledInput
            label={ar ? "شركة" : "Company"}
            value={draft.companyLabel}
            onChange={(v) => setDraft({ companyLabel: v })}
            list="brain-company-suggestions"
          />
          <SuggestionList id="brain-person-suggestions" items={personSuggestions} />
          <SuggestionList id="brain-company-suggestions" items={companySuggestions} />
          <div className="space-y-1.5">
            <FieldLabel>Priority</FieldLabel>
            <PriorityChips
              value={draft.priority}
              onChange={(p) => setDraft({ priority: p })}
            />
          </div>
          <NotesField
            draft={draft}
            setDraft={setDraft}
            ar={ar}
            rows={10}
            placeholder={ar ? "اكتب عن العلاقة…" : "Write about the relationship…"}
          />
        </EditorShell>
      );

    case "reminders":
      return (
        <EditorShell>
          <TitleField draft={draft} setDraft={setDraft} ar={ar} placeholder={ar ? "إيه اللي ذاكرك؟" : "What to remember?"} />
          <div className="space-y-1.5">
            <FieldLabel>{ar ? "ميعاد" : "Due"}</FieldLabel>
            <Input
              type="datetime-local"
              value={draft.dueAt}
              onChange={(e) => setDraft({ dueAt: e.target.value })}
              className="h-9 border-violet-500/25 bg-violet-950/50 text-violet-50"
            />
          </div>
          <ReminderToggle
            enabled={draft.reminderEnabled}
            onChange={(v) => setDraft({ reminderEnabled: v })}
            label={ar ? "تذكير نشط" : "Active reminder"}
          />
          {statuses ? (
            <div className="space-y-1.5">
              <FieldLabel>Status</FieldLabel>
              <ChipRow
                options={statuses}
                value={draft.status}
                onChange={(v) => setDraft({ status: v })}
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <FieldLabel>Priority</FieldLabel>
            <PriorityChips
              value={draft.priority}
              onChange={(p) => setDraft({ priority: p })}
            />
          </div>
          <NotesField draft={draft} setDraft={setDraft} ar={ar} rows={6} />
        </EditorShell>
      );

    case "personal_decisions":
      return (
        <EditorShell>
          <TitleField draft={draft} setDraft={setDraft} ar={ar} placeholder={ar ? "القرار" : "Decision"} />
          <LabeledInput
            label={ar ? "الخيار اللي بأميل له" : "Leaning toward"}
            value={draft.decision}
            onChange={(v) => setDraft({ decision: v })}
          />
          {statuses ? (
            <div className="space-y-1.5">
              <FieldLabel>Status</FieldLabel>
              <ChipRow
                options={statuses}
                value={draft.status}
                onChange={(v) => setDraft({ status: v })}
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <FieldLabel>Priority</FieldLabel>
            <PriorityChips
              value={draft.priority}
              onChange={(p) => setDraft({ priority: p })}
            />
          </div>
          <NotesField
            draft={draft}
            setDraft={setDraft}
            ar={ar}
            rows={8}
            placeholder={ar ? "سياق القرار…" : "Decision context…"}
          />
        </EditorShell>
      );

    case "meeting_notes":
      return (
        <EditorShell>
          <TitleField draft={draft} setDraft={setDraft} ar={ar} placeholder={ar ? "عنوان الاجتماع" : "Meeting title"} />
          <LabeledInput
            label={ar ? "حضور" : "Attendees"}
            value={draft.attendees}
            onChange={(v) => setDraft({ attendees: v })}
            placeholder={ar ? "أسماء حرة" : "Free-text names"}
          />
          <div className="space-y-1.5">
            <FieldLabel>{ar ? "تاريخ" : "When"}</FieldLabel>
            <Input
              type="datetime-local"
              value={draft.dueAt}
              onChange={(e) => setDraft({ dueAt: e.target.value })}
              className="h-9 border-violet-500/25 bg-violet-950/50 text-violet-50"
            />
          </div>
          <NotesField
            draft={draft}
            setDraft={setDraft}
            ar={ar}
            rows={10}
            placeholder={ar ? "ملاحظات الاجتماع…" : "Meeting notes…"}
          />
        </EditorShell>
      );

    case "future_plans":
      return (
        <EditorShell>
          <TitleField draft={draft} setDraft={setDraft} ar={ar} placeholder={ar ? "الخطة" : "Plan"} />
          <LabeledInput
            label={ar ? "الأفق الزمني" : "Horizon"}
            value={draft.horizon}
            onChange={(v) => setDraft({ horizon: v })}
            placeholder={ar ? "Q4 / 2027 / بعد رمضان…" : "Q4 / 2027 / after Ramadan…"}
          />
          {statuses ? (
            <div className="space-y-1.5">
              <FieldLabel>Status</FieldLabel>
              <ChipRow
                options={statuses}
                value={draft.status}
                onChange={(v) => setDraft({ status: v })}
              />
            </div>
          ) : null}
          <div className="space-y-1.5">
            <FieldLabel>Priority</FieldLabel>
            <PriorityChips
              value={draft.priority}
              onChange={(p) => setDraft({ priority: p })}
            />
          </div>
          <NotesField draft={draft} setDraft={setDraft} ar={ar} rows={8} />
        </EditorShell>
      );

    case "ideas":
      return (
        <EditorShell>
          <TitleField draft={draft} setDraft={setDraft} ar={ar} placeholder={ar ? "الفكرة" : "Idea"} />
          <div className="space-y-1.5">
            <FieldLabel>Priority</FieldLabel>
            <PriorityChips
              value={draft.priority}
              onChange={(p) => setDraft({ priority: p })}
            />
          </div>
          <NotesField
            draft={draft}
            setDraft={setDraft}
            ar={ar}
            rows={12}
            placeholder={ar ? "اكتب الفكرة بحرية…" : "Capture the idea freely…"}
          />
        </EditorShell>
      );

    case "archive":
      return (
        <EditorShell>
          <p className="text-xs text-violet-300/60">
            {ar
              ? "الأرشيف للعرض. استخدم «أرشفة» من ملاحظة تانية."
              : "Archive is for browsing. Use Archive on another note."}
          </p>
          <TitleField draft={draft} setDraft={setDraft} ar={ar} />
          <NotesField draft={draft} setDraft={setDraft} ar={ar} rows={6} />
        </EditorShell>
      );

    case "inbox":
    default:
      return (
        <EditorShell>
          <TitleField draft={draft} setDraft={setDraft} ar={ar} />
          <div className="space-y-1.5">
            <FieldLabel>Priority</FieldLabel>
            <PriorityChips
              value={draft.priority}
              onChange={(p) => setDraft({ priority: p })}
            />
          </div>
          <ReminderToggle
            enabled={draft.reminderEnabled}
            onChange={(v) => setDraft({ reminderEnabled: v })}
            label={ar ? "تذكير" : "Reminder"}
          />
          <NotesField
            draft={draft}
            setDraft={setDraft}
            ar={ar}
            rows={12}
            placeholder={
              ar ? "اكتب… مفيش ضغط. ده دماغك." : "Write freely… this is your brain."
            }
          />
        </EditorShell>
      );
  }
}

function EditorShell({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>;
}

function TitleField({
  draft,
  setDraft,
  ar,
  placeholder,
}: {
  draft: EditorDraft;
  setDraft: (p: Partial<EditorDraft>) => void;
  ar: boolean;
  placeholder?: string;
}) {
  return (
    <Input
      value={draft.title}
      onChange={(e) => setDraft({ title: e.target.value })}
      placeholder={placeholder ?? (ar ? "عنوان (اختياري)" : "Title (optional)")}
      className="border-0 border-b border-violet-500/20 bg-transparent px-0 text-lg text-violet-50 shadow-none placeholder:text-violet-400/35 focus-visible:border-violet-400/40 focus-visible:ring-0"
    />
  );
}

function NotesField({
  draft,
  setDraft,
  ar,
  rows,
  placeholder,
}: {
  draft: EditorDraft;
  setDraft: (p: Partial<EditorDraft>) => void;
  ar: boolean;
  rows: number;
  placeholder?: string;
}) {
  return (
    <Textarea
      value={draft.body}
      onChange={(e) => setDraft({ body: e.target.value })}
      placeholder={
        placeholder ?? (ar ? "ملاحظات…" : "Notes…")
      }
      rows={rows}
      className="min-h-[120px] resize-none border-0 bg-transparent px-0 text-sm leading-relaxed text-violet-100/90 shadow-none placeholder:text-violet-400/35 focus-visible:ring-0"
    />
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  list,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  list?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={list}
        className="h-9 border-violet-500/25 bg-violet-950/50 text-xs text-violet-100"
      />
    </label>
  );
}

function SuggestionList({ id, items }: { id: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <datalist id={id}>
      {items.map((item) => (
        <option key={item} value={item} />
      ))}
    </datalist>
  );
}
