/**
 * Free-text people/company suggestions from Founder Brain history only.
 * Never queries ERP clients table. Non-binding labels.
 */

import type { BrainEntry } from "@/lib/brain/types";

export function suggestPersonLabels(
  entries: BrainEntry[],
  query: string,
  limit = 8
): string[] {
  return collectDistinct(
    entries.flatMap((e) =>
      [e.personLabel, e.clientLabel].filter(Boolean) as string[]
    ),
    query,
    limit
  );
}

export function suggestCompanyLabels(
  entries: BrainEntry[],
  query: string,
  limit = 8
): string[] {
  return collectDistinct(
    entries
      .map((e) => e.companyLabel)
      .filter((x): x is string => Boolean(x?.trim())),
    query,
    limit
  );
}

function collectDistinct(
  values: string[],
  query: string,
  limit: number
): string[] {
  const q = query.trim().toLowerCase();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const v = raw.trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    if (q && !key.includes(q)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= limit) break;
  }
  return out;
}
