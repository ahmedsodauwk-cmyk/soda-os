"use client";

/**
 * Related Memories + entity timeline + soft suggestions.
 * Memory/Context Engine UI — never auto-modifies Brain entries.
 */

import Link from "next/link";

import type {
  EntityTimeline,
  RelatedMemory,
} from "@/lib/brain/intelligence/types";
import { WORKSPACE_LABELS_AR, WORKSPACE_LABELS_EN } from "@/lib/brain/types";
import { cn } from "@/lib/utils";

type Props = {
  related: RelatedMemory[];
  timelines: EntityTimeline[];
  suggestions: string[];
  ar: boolean;
};

export function RelatedMemoriesPanel({
  related,
  timelines,
  suggestions,
  ar,
}: Props) {
  const labels = ar ? WORKSPACE_LABELS_AR : WORKSPACE_LABELS_EN;
  const empty =
    related.length === 0 &&
    timelines.length === 0 &&
    suggestions.length === 0;

  return (
    <div className="space-y-4">
      <section>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-violet-300/65">
          {ar ? "ذكريات مرتبطة" : "Related Memories"}
        </p>
        {empty ? (
          <p className="text-[11px] leading-relaxed text-violet-400/45">
            {ar
              ? "لما نفهم حاجة، الذكريات المرتبطة هتظهر هنا."
              : "Related memories show up here once there's something useful."}
          </p>
        ) : null}
        <ul className="space-y-2">
          {related.map((r) => (
            <li
              key={r.entry.id}
              className="rounded-lg border border-violet-500/15 bg-violet-950/35 px-2.5 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-violet-100/90">
                  {labels[r.entry.workspace] ?? r.entry.workspace}
                </span>
                {r.entry.amount != null ? (
                  <span className="text-[10px] tabular-nums text-violet-300/70">
                    {r.entry.amount.toLocaleString()}{" "}
                    {r.entry.currency ?? "EGP"}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 line-clamp-2 text-[11px] text-violet-200/65">
                {r.entry.title || r.entry.body || r.entry.rawText}
              </p>
              {(r.entry.personLabel ||
                r.entry.companyLabel ||
                r.entry.clientLabel) && (
                <p className="mt-1 text-[10px] text-violet-400/55">
                  {[r.entry.personLabel, r.entry.companyLabel, r.entry.clientLabel]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {(ar ? r.suggestionAr : r.suggestionEn) ? (
                <p className="mt-1.5 border-t border-violet-500/10 pt-1.5 text-[10px] leading-relaxed text-amber-100/70">
                  {ar ? r.suggestionAr : r.suggestionEn}
                </p>
              ) : null}
              <Link
                href="/brain"
                className="mt-1 inline-block text-[10px] text-violet-400/60 hover:text-violet-200"
              >
                {ar ? "افتح في الدماغ →" : "Open in Brain →"}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {suggestions.length > 0 ? (
        <section>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-violet-300/65">
            {ar ? "اقتراحات" : "Suggestions"}
          </p>
          <ul className="space-y-1.5">
            {suggestions.map((s, i) => (
              <li
                key={i}
                className="rounded-lg border border-amber-500/15 bg-amber-500/5 px-2.5 py-2 text-[11px] leading-relaxed text-amber-50/80"
              >
                {s}
                <span className="mt-1 block text-[9px] text-amber-200/45">
                  {ar
                    ? "اقتراح فقط — مش هيتعدل أي سجل لوحده"
                    : "Suggestion only — never auto-modifies records"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {timelines.length > 0 ? (
        <section>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-violet-300/65">
            {ar ? "خط زمني" : "Timeline"}
          </p>
          {timelines.map((t) => (
            <div key={t.label} className="mb-3">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-medium text-violet-100">{t.label}</p>
                {t.moneyOutstandingHint != null ? (
                  <p className="text-[10px] tabular-nums text-violet-300/60">
                    {ar ? "تقريبي مستحق" : "approx outstanding"}{" "}
                    {t.moneyOutstandingHint.toLocaleString()}
                  </p>
                ) : null}
              </div>
              <ol className="relative space-y-2 border-s border-violet-500/20 ps-3">
                {t.events.map((ev) => (
                  <li key={ev.entryId} className="relative">
                    <span
                      className={cn(
                        "absolute -start-[17px] top-1.5 size-1.5 rounded-full bg-violet-400/70"
                      )}
                    />
                    <p className="text-[10px] text-violet-400/50">
                      {new Date(ev.at).toLocaleDateString(
                        ar ? "ar-EG" : "en-GB",
                        { day: "numeric", month: "short" }
                      )}{" "}
                      · {labels[ev.workspace] ?? ev.workspace}
                    </p>
                    <p className="line-clamp-2 text-[11px] text-violet-200/75">
                      {ev.title || ev.snippet}
                    </p>
                    {ev.amount != null ? (
                      <p className="text-[10px] tabular-nums text-violet-300/55">
                        {ev.amount.toLocaleString()}
                        {ev.status ? ` · ${ev.status}` : ""}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
