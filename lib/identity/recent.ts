/**
 * Recently viewed records — cookie-backed, synced to recent_activity when available.
 */

import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import type { SodaSession } from "@/lib/identity/session";

export type RecentRecord = {
  entityType: string;
  entityId: string;
  label: string;
  href: string;
  viewedAt: string;
};

const COOKIE = "soda_recent";
const MAX = 12;

function parseCookie(raw: string | undefined): RecentRecord[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as RecentRecord[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export async function getRecentlyViewed(): Promise<RecentRecord[]> {
  const jar = await cookies();
  return parseCookie(jar.get(COOKIE)?.value);
}

export async function recordRecentView(
  session: SodaSession | null,
  record: Omit<RecentRecord, "viewedAt"> & { viewedAt?: string }
): Promise<void> {
  const jar = await cookies();
  const viewedAt = record.viewedAt ?? new Date().toISOString();
  const next: RecentRecord = { ...record, viewedAt };
  const prev = parseCookie(jar.get(COOKIE)?.value).filter(
    (r) => !(r.entityType === next.entityType && r.entityId === next.entityId)
  );
  const list = [next, ...prev].slice(0, MAX);
  try {
    jar.set(COOKIE, encodeURIComponent(JSON.stringify(list)), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  } catch {
    // read-only cookies in some RSC paths
  }

  if (!session || session.userId === "local-owner") return;
  try {
    const supabase = await createClient();
    await supabase.from("recent_activity").upsert(
      {
        user_id: session.userId,
        entity_type: next.entityType,
        entity_id: next.entityId,
        label: next.label,
        href: next.href,
        viewed_at: viewedAt,
      },
      { onConflict: "user_id,entity_type,entity_id" }
    );
  } catch {
    // table may not exist yet
  }
}
