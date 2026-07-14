"use client";

import { promoteBrainEntryAction } from "@/lib/brain/actions";
import type { PromoteTarget } from "@/lib/brain/types";
import { PROMOTE_TARGETS } from "@/lib/brain/types";

const LABELS: Record<PromoteTarget, string> = {
  order: "Convert to Order",
  client: "Convert to Client",
  reminder: "Convert to Reminder",
  calendar: "Convert to Calendar",
  finance_note: "Convert to Finance",
  none: "None",
};

/** Promote Engine placeholders — always disabled / future. */
export function PromotePlaceholders({
  entryId,
  locale,
}: {
  entryId: string;
  locale: string;
}) {
  const ar = locale === "ar";

  return (
    <div className="rounded-xl border border-dashed border-violet-500/20 bg-violet-950/20 px-3 py-3">
      <p className="mb-2 text-[10px] tracking-wide text-violet-400/55 uppercase">
        {ar ? "Promote Engine — قريبًا" : "Promote Engine — coming later"}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PROMOTE_TARGETS.filter((t) => t !== "none").map((target) => (
          <button
            key={target}
            type="button"
            disabled
            title={ar ? "قريبًا — مش بيحوّل لـ ERP" : "Future — does not create ERP"}
            onClick={async () => {
              await promoteBrainEntryAction(entryId, target);
            }}
            className="cursor-not-allowed rounded-md border border-violet-500/15 px-2 py-1 text-[10px] text-violet-300/35"
          >
            {LABELS[target]}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-violet-400/40">
        {ar
          ? "الأزرار موقوفة. كل حاجة بتفضل في الدماغ."
          : "Buttons disabled. Everything stays in Brain until Promote ships."}
      </p>
    </div>
  );
}
