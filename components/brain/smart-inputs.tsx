"use client";

/**
 * SODA Brain smart inputs — currency, amount, priority chips, status, quick amounts.
 */

import { cn } from "@/lib/utils";
import {
  CURRENCIES,
  PRIORITIES,
  QUICK_AMOUNTS,
  type BrainCurrency,
  type BrainPriority,
} from "@/lib/brain/types";

export function ChipRow({
  options,
  value,
  onChange,
  labels,
}: {
  options: readonly string[];
  value: string | null;
  onChange: (v: string | null) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(active ? null : opt)}
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] transition-colors",
              active
                ? "bg-violet-500/80 text-white"
                : "bg-violet-500/10 text-violet-200/75 hover:bg-violet-500/20"
            )}
          >
            {labels?.[opt] ?? opt}
          </button>
        );
      })}
    </div>
  );
}

export function PriorityChips({
  value,
  onChange,
}: {
  value: BrainPriority | null;
  onChange: (v: BrainPriority | null) => void;
}) {
  return (
    <ChipRow
      options={PRIORITIES}
      value={value}
      onChange={(v) => onChange((v as BrainPriority) || null)}
    />
  );
}

export function CurrencyPicker({
  value,
  onChange,
}: {
  value: BrainCurrency | null;
  onChange: (v: BrainCurrency) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CURRENCIES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] tabular-nums transition-colors",
            value === c
              ? "bg-violet-500/80 text-white"
              : "bg-violet-500/10 text-violet-200/75 hover:bg-violet-500/20"
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export function QuickAmountButtons({
  onPick,
}: {
  onPick: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {QUICK_AMOUNTS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onPick(n)}
          className="rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] tabular-nums text-violet-200/70 hover:bg-violet-500/25"
        >
          {n >= 1000 ? `${n / 1000}k` : n}
        </button>
      ))}
    </div>
  );
}

export function ReminderToggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={cn(
        "rounded-md px-2.5 py-1 text-[11px] transition-colors",
        enabled
          ? "bg-amber-500/25 text-amber-100"
          : "bg-violet-500/10 text-violet-200/70 hover:bg-violet-500/20"
      )}
    >
      {label}: {enabled ? "ON" : "OFF"}
    </button>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] tracking-wide text-violet-400/70 uppercase">
      {children}
    </span>
  );
}
