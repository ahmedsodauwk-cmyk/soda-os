"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Trash2 } from "lucide-react";

import { ProjectStatusBadge } from "@/components/projects/project-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UI_ACTIONS } from "@/lib/brand/ui-actions";
import { getAllClients, refreshClients } from "@/lib/clients/repository";
import type { Client } from "@/lib/clients/types";
import {
  createProject,
  deleteProject,
  getProjects,
  refreshProjects,
  updateProject,
} from "@/lib/projects/repository";
import {
  PROJECT_STATUSES,
  type Project,
  type ProjectStatus,
} from "@/lib/projects/types";
import { filterProjects } from "@/lib/projects/utils";
import { getWorkspaces } from "@/lib/taxonomy/repository";

function emptyHub() {
  return {
    overview: { summary: "", milestones: [] as string[], nextAction: "" },
    orders: [] as Project["orders"],
    calendar: [] as Project["calendar"],
    files: [] as Project["files"],
    payments: [] as Project["payments"],
    timeline: [] as Project["timeline"],
    notes: [] as Project["notes"],
    activity: [] as Project["activity"],
    deliverables: [] as Project["deliverables"],
  };
}

function AddProjectDialog({
  clients,
  onCreated,
}: {
  clients: Client[];
  onCreated: (p: Project) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [workspaceId, setWorkspaceId] = useState("weddings");
  const [status, setStatus] = useState<ProjectStatus>("Active");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const workspaces = getWorkspaces();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const client = clients.find((c) => c.id === clientId);
    if (!name.trim() || !client) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const project = await createProject({
        name: name.trim(),
        workspaceId,
        clientName: client.name,
        clientId: client.id,
        status,
        progress: 0,
        ordersCount: 0,
        revenue: 0,
        team: [],
        upcomingShoots: [],
        lastActivity: now,
        description: description.trim() || undefined,
        isActive: true,
        ...emptyHub(),
      });
      onCreated(project);
      setName("");
      setClientId("");
      setDescription("");
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="cursor-pointer gap-1.5" />}>
        + New
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Create a project linked to an existing client.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="proj-name">Name</Label>
              <Input
                id="proj-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Select value={clientId} onValueChange={(v) => v && setClientId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Workspace</Label>
                <Select
                  value={workspaceId}
                  onValueChange={(v) => v && setWorkspaceId(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => v && setStatus(v as ProjectStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-desc">Description</Label>
              <Textarea
                id="proj-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving || !clientId}>
              {saving ? UI_ACTIONS.creating : UI_ACTIONS.createProject}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectsListContent() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshClients();
      await refreshProjects();
      if (!cancelled) {
        setClients(getAllClients().filter((c) => c.isActive));
        setProjects(getProjects());
      }
    })().catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => filterProjects(projects, search, statusFilter),
    [projects, search, statusFilter]
  );

  async function handleStatusChange(id: string, status: ProjectStatus) {
    await updateProject(id, { status });
    setProjects(getProjects());
    router.refresh();
  }

  async function handleDelete(project: Project) {
    if (!window.confirm(`Delete project “${project.name}”?`)) return;
    await deleteProject(project.id);
    setProjects(getProjects());
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects…"
                className="h-8 pl-8"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => v && setStatusFilter(v)}
            >
              <SelectTrigger className="h-8 w-full sm:w-40" size="sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AddProjectDialog
            clients={clients}
            onCreated={(p) => {
              setProjects(getProjects());
              router.refresh();
              void p;
            }}
          />
        </CardContent>
      </Card>

      <ul className="space-y-2">
        {filtered.map((project) => (
          <li
            key={project.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 px-3.5 py-3"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/projects/${project.id}`}
                className="font-medium hover:text-soda-pink"
              >
                {project.name}
              </Link>
              <p className="text-xs text-muted-foreground">
                {project.clientName} · {project.workspaceId} ·{" "}
                {project.ordersCount} orders
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={project.status}
                onValueChange={(v) => {
                  if (v) void handleStatusChange(project.id, v as ProjectStatus);
                }}
              >
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ProjectStatusBadge status={project.status} />
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 text-destructive"
                onClick={() => void handleDelete(project)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects match.</p>
      ) : null}
    </div>
  );
}
