import { NextResponse } from "next/server";

import { requireBackupFounder } from "@/lib/backup/access";
import { streamManualBackupPackage } from "@/lib/backup/package";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Create + stream Recovery Metadata Package in one request.
 * Avoids Vercel ephemeral FS round-trip for download.
 */
export async function POST() {
  const session = await requireBackupFounder();
  if (!session) {
    return NextResponse.json({ error: "Founder access required." }, { status: 403 });
  }

  const result = await streamManualBackupPackage(session);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return new NextResponse(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${result.entry.zipFileName}"`,
      "Content-Length": String(result.buffer.length),
      "Cache-Control": "no-store",
      "X-SODA-Backup-Id": result.backupId,
    },
  });
}
