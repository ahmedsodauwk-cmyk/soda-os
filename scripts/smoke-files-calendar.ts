/**
 * Files + calendar smoke against Supabase.
 * Run: NODE_OPTIONS=--use-system-ca npx tsx scripts/smoke-files-calendar.ts
 */
import { getCalendarEvents, refreshCalendar } from "../lib/calendar/repository";
import { createClient, deleteClient } from "../lib/clients/repository";
import {
  createFile,
  deleteFile,
  getFilesByProject,
  refreshFiles,
} from "../lib/files/repository";
import {
  createProject,
  deleteProject,
  refreshProjects,
} from "../lib/projects/repository";
import { ensureTaxonomyPersisted } from "../lib/taxonomy/persist";
import { loadEnvLocal } from "./load-env-local";
import { assertNonProductionTarget } from "./assert-non-production";

async function main() {
  loadEnvLocal();
  assertNonProductionTarget("smoke-files-calendar");
  console.log("=== Files + Calendar smoke ===");
  await ensureTaxonomyPersisted();

  const client = await createClient({
    type: "company",
    segment: "commercial",
    name: `Smoke Files Co ${Date.now()}`,
    phone: "01005554433",
  });

  await refreshProjects();
  const project = await createProject({
    name: `Smoke Files Project ${Date.now()}`,
    workspaceId: "commercial",
    clientId: client.id,
    clientName: client.name,
    status: "Active",
    progress: 0,
    ordersCount: 0,
    revenue: 0,
    team: [],
    upcomingShoots: [],
    lastActivity: new Date().toISOString(),
    isActive: true,
    overview: { summary: "", milestones: [], nextAction: "" },
    orders: [],
    calendar: [
      {
        id: `cal-${Date.now()}`,
        title: "Smoke milestone",
        startsAt: new Date().toISOString(),
        kind: "milestone",
      },
    ],
    files: [],
    payments: [],
    timeline: [],
    notes: [],
    activity: [],
    deliverables: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await refreshFiles();
  const file = await createFile({
    name: `Smoke file ${Date.now()}.pdf`,
    type: "Document",
    size: "12 KB",
    projectId: project.id,
    workspaceId: project.workspaceId,
    mimeType: "application/pdf",
  });
  await refreshFiles();
  const found = getFilesByProject(project.id).find((f) => f.id === file.id);
  if (!found) throw new Error("Created file not in project list");
  await deleteFile(file.id);
  console.log("files ok");

  const events = await refreshCalendar();
  const hasMilestone = events.some((e) => e.projectId === project.id);
  if (!hasMilestone) {
    throw new Error("Expected project calendar event in derived calendar");
  }
  console.log(
    `calendar ok (${events.length} events, sample=${getCalendarEvents()[0]?.title ?? "none"})`
  );

  await deleteProject(project.id);
  await deleteClient(client.id);
  console.log("=== PASS ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
