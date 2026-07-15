import { readFileSync, existsSync } from "node:fs";
import { NextResponse } from "next/server";

import { requireBackupFounder } from "@/lib/backup/access";
import { getBackupZipPath } from "@/lib/backup/paths";
import { getBackupHistoryEntry } from "@/lib/backup/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireBackupFounder();
  if (!session) {
    return NextResponse.json({ error: "Founder access required." }, { status: 403 });
  }

  const { id: rawId } = await context.params;
  const id = decodeURIComponent(rawId ?? "").trim();
  if (!id || id.includes("..") || id.includes("/") || id.includes("\\")) {
    return NextResponse.json({ error: "Invalid backup id." }, { status: 400 });
  }

  const entry = getBackupHistoryEntry(id);
  const zipPath = getBackupZipPath(id);
  if (!entry || !existsSync(zipPath)) {
    return NextResponse.json({ error: "Backup not found." }, { status: 404 });
  }

  const data = readFileSync(zipPath);
  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${entry.zipFileName}"`,
      "Content-Length": String(data.length),
      "Cache-Control": "no-store",
    },
  });
}
