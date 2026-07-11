"use client";

import { useMemo, useState } from "react";
import { Plus, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getClients } from "@/lib/clients/repository";
import type { Client } from "@/lib/clients/types";
import { getSuccessMessage } from "@/lib/brand/soda-voice";
import {
  createClientInline,
  getClientOrderContext,
  type ClientOrderContext,
} from "@/lib/orders/engine";
import {
  DRESS_CODES,
  ORDER_STATUSES,
  PROJECT_TYPES,
  TEAMS,
  type DressCode,
  type OrderStatus,
  type ProjectType,
  type SmartOrderInput,
} from "@/lib/orders/types";
import { workspaceIdFromProjectType } from "@/lib/orders/utils";
import { validateSmartOrderInput } from "@/lib/orders/validation";
import { getPeople } from "@/lib/people/repository";
import { getProjectsByClient } from "@/lib/projects/repository";
import { getProjectOperatingView } from "@/lib/integration";
import { formatPrice } from "@/lib/orders/utils";

type FormState = SmartOrderInput & {
  createNewClient: boolean;
  createNewProject: boolean;
  projectName: string;
};

function buildEmptyForm(defaultProjectType?: ProjectType): FormState {
  const projectType = defaultProjectType ?? "Wedding";
  return {
    clientName: "",
    phone: "",
    whatsapp: "",
    projectType,
    workspaceId: workspaceIdFromProjectType(projectType),
    shootDate: "",
    location: "",
    deliveryDate: "",
    price: 0,
    deposit: 0,
    team:
      projectType === "Wedding" || projectType === "Engagement"
        ? "Wedding Squad"
        : projectType === "Commercial" || projectType === "Product"
          ? "Commercial Team"
          : "Alpha Crew",
    squadMemberIds: [],
    status: "Holding",
    brief: "",
    latePenaltyEnabled: false,
    latePenaltyAmount: 0,
    latePenaltyReason: "",
    notes: "",
    createNewClient: false,
    createNewProject: false,
    projectName: "",
  };
}

interface AddOrderDialogProps {
  onAdd: (order: SmartOrderInput) => void | Promise<void>;
  defaultProjectType?: ProjectType;
  triggerLabel?: string;
}

export function AddOrderDialog({
  onAdd,
  defaultProjectType,
  triggerLabel = "Add Order",
}: AddOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() =>
    buildEmptyForm(defaultProjectType)
  );
  const [clientQuery, setClientQuery] = useState("");
  const [clientCtx, setClientCtx] = useState<ClientOrderContext | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [phoneLocked, setPhoneLocked] = useState(false);

  const clients = useMemo(() => getClients(), []);
  const people = useMemo(
    () => getPeople().filter((p) => p.status === "active"),
    []
  );

  const clientSuggestions = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q || form.createNewClient) return [];
    return clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.whatsapp ?? "").includes(q) ||
          (c.company ?? "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [clientQuery, clients, form.createNewClient]);

  const clientProjects = useMemo(() => {
    if (!form.clientId) return [];
    return getProjectsByClient(form.clientId).filter(
      (p) => p.isActive && p.status !== "Cancelled"
    );
  }, [form.clientId]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field as string];
        return next;
      });
    }
  }

  function selectClient(client: Client) {
    const ctx = getClientOrderContext(client.id);
    setClientCtx(ctx);
    setClientQuery(client.name);
    setPhoneLocked(true);
    setForm((prev) => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      phone: client.phone,
      whatsapp: client.whatsapp ?? client.phone,
      createNewClient: false,
      projectId: undefined,
      createNewProject: false,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.clientName;
      delete next.phone;
      delete next.clientId;
      return next;
    });
  }

  function startCreateClient() {
    setClientCtx(null);
    setPhoneLocked(false);
    setForm((prev) => ({
      ...prev,
      clientId: undefined,
      createNewClient: true,
      clientName: clientQuery.trim() || prev.clientName,
      phone: "",
      whatsapp: "",
      projectId: undefined,
    }));
  }

  function toggleSquadMember(personId: string) {
    setForm((prev) => {
      const set = new Set(prev.squadMemberIds ?? []);
      if (set.has(personId)) set.delete(personId);
      else set.add(personId);
      return { ...prev, squadMemberIds: [...set] };
    });
  }

  function validate(): boolean {
    const next = validateSmartOrderInput(form);
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      let payload: SmartOrderInput = { ...form };
      if (form.createNewClient && !form.clientId) {
        const client = await createClientInline({
          name: form.clientName,
          phone: form.phone,
          whatsapp: form.whatsapp || form.phone,
          projectType: form.projectType,
        });
        payload = {
          ...payload,
          clientId: client.id,
          createNewClient: false,
          phone: client.phone,
          whatsapp: client.whatsapp ?? client.phone,
        };
      }
      await onAdd(payload);
      setForm(buildEmptyForm(defaultProjectType));
      setClientQuery("");
      setClientCtx(null);
      setErrors({});
      setPhoneLocked(false);
      setSuccessNote(getSuccessMessage("orderCreated"));
      setOpen(false);
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : "Failed to create order",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setForm(buildEmptyForm(defaultProjectType));
      setClientQuery("");
      setClientCtx(null);
      setErrors({});
      setPhoneLocked(false);
    } else {
      setSuccessNote(null);
    }
  }

  return (
    <>
      {successNote ? (
        <p
          role="status"
          className="order-first w-full text-center text-xs text-emerald-500 sm:order-none sm:w-auto sm:text-right"
        >
          {successNote}
        </p>
      ) : null}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger render={<Button className="gap-1.5" />}>
          <Plus />
          {triggerLabel}
        </DialogTrigger>

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Order</DialogTitle>
            <DialogDescription>
              Client, project, squad, and status drive the rest of the OS.
              Delivery date and location are optional.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="grid gap-4">
            {errors.form ? (
              <p className="text-xs text-destructive">{errors.form}</p>
            ) : null}

            {/* Smart Client */}
            <div className="space-y-2 rounded-md border border-border/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="clientSearch">Client</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={startCreateClient}
                >
                  <UserPlus className="size-3.5" />
                  Create New Client
                </Button>
              </div>
              <Input
                id="clientSearch"
                value={clientQuery}
                onChange={(e) => {
                  setClientQuery(e.target.value);
                  if (!form.createNewClient) {
                    updateField("clientName", e.target.value);
                  }
                }}
                placeholder="Search clients by name or phone…"
                aria-invalid={!!errors.clientName}
                autoComplete="off"
              />
              {clientSuggestions.length > 0 ? (
                <ul className="max-h-36 overflow-y-auto rounded-md border border-border/50 bg-background text-sm">
                  {clientSuggestions.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-muted/60"
                        onClick={() => selectClient(c)}
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {c.phone}
                          {c.whatsapp ? ` · WA ${c.whatsapp}` : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {form.createNewClient ? (
                <p className="text-xs text-muted-foreground">
                  Creating a new client inline. Phone is editable now; later
                  changes go through Client Profile.
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="clientName">Name</Label>
                  <Input
                    id="clientName"
                    value={form.clientName}
                    onChange={(e) => {
                      updateField("clientName", e.target.value);
                      setClientQuery(e.target.value);
                    }}
                    aria-invalid={!!errors.clientName}
                  />
                  {errors.clientName ? (
                    <p className="text-xs text-destructive">{errors.clientName}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    disabled={phoneLocked && !form.createNewClient}
                    aria-invalid={!!errors.phone}
                    placeholder="+20 100 000 0000"
                  />
                  {errors.phone ? (
                    <p className="text-xs text-destructive">{errors.phone}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={form.whatsapp}
                    onChange={(e) => updateField("whatsapp", e.target.value)}
                    disabled={phoneLocked && !form.createNewClient}
                    placeholder="Same as phone if empty"
                  />
                </div>
              </div>

              {clientCtx ? (
                <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  <p>Previous orders: {clientCtx.previousOrders.length}</p>
                  <p>Projects: {clientCtx.projects.length}</p>
                  <p>Revenue: {clientCtx.revenue.toLocaleString("en-EG")} EGP</p>
                  <p>
                    Outstanding: {clientCtx.outstanding.toLocaleString("en-EG")}{" "}
                    EGP ({clientCtx.collectionStatus})
                  </p>
                  <p>Last shoot: {clientCtx.lastShoot ?? "—"}</p>
                </div>
              ) : null}
            </div>

            {/* Project */}
            <div className="space-y-2 rounded-md border border-border/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <Label>Project</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      createNewProject: true,
                      projectId: undefined,
                    }))
                  }
                >
                  Create New Project
                </Button>
              </div>
              {!form.createNewProject && clientProjects.length > 0 ? (
                <Select
                  value={form.projectId ?? ""}
                  onValueChange={(v) => {
                    if (!v) return;
                    updateField("projectId", v);
                    updateField("createNewProject", false);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose existing project" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientProjects.map((p) => {
                      const op = getProjectOperatingView(p.id);
                      const fin = op.finance;
                      return (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} · {p.status} · rev {formatPrice(fin.revenue)}{" "}
                          · profit {formatPrice(fin.profit)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={form.projectName}
                  onChange={(e) => updateField("projectName", e.target.value)}
                  placeholder="New project name (optional)"
                />
              )}
              <p className="text-xs text-muted-foreground">
                {form.createNewProject
                  ? "A new project will be created and linked."
                  : form.projectId
                    ? "Linking to the selected project."
                    : "If none selected, a project is auto-created on submit."}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Project Type</Label>
                <Select
                  value={form.projectType}
                  onValueChange={(value) => {
                    if (!value) return;
                    const projectType = value as ProjectType;
                    setForm((prev) => ({
                      ...prev,
                      projectType,
                      workspaceId: workspaceIdFromProjectType(projectType),
                    }));
                  }}
                >
                  <SelectTrigger aria-invalid={!!errors.projectType}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Order Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => {
                    if (value) updateField("status", value as OrderStatus);
                  }}
                >
                  <SelectTrigger aria-invalid={!!errors.status}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="shootDate">Shoot Date</Label>
                <Input
                  id="shootDate"
                  type="date"
                  value={form.shootDate}
                  onChange={(e) => updateField("shootDate", e.target.value)}
                  aria-invalid={!!errors.shootDate}
                />
                {errors.shootDate ? (
                  <p className="text-xs text-destructive">{errors.shootDate}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deliveryDate">Delivery Date (optional)</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={form.deliveryDate}
                  onChange={(e) => updateField("deliveryDate", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                placeholder="Four Seasons Nile Plaza, Cairo"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">Price (EGP)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  value={form.price || ""}
                  onChange={(e) =>
                    updateField("price", Number(e.target.value) || 0)
                  }
                  aria-invalid={!!errors.price}
                />
                {errors.price ? (
                  <p className="text-xs text-destructive">{errors.price}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deposit">Deposit (EGP)</Label>
                <Input
                  id="deposit"
                  type="number"
                  min={0}
                  value={form.deposit || ""}
                  onChange={(e) =>
                    updateField("deposit", Number(e.target.value) || 0)
                  }
                  aria-invalid={!!errors.deposit}
                />
                {errors.deposit ? (
                  <p className="text-xs text-destructive">{errors.deposit}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label>Squad</Label>
                <Select
                  value={form.team}
                  onValueChange={(value) => {
                    if (value) updateField("team", value);
                  }}
                >
                  <SelectTrigger aria-invalid={!!errors.team}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAMS.map((team) => (
                      <SelectItem key={team} value={team}>
                        {team}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Team members → assignments */}
            <div className="space-y-2">
              <Label>Team Members</Label>
              <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-border/50 p-2">
                {people.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No active crew members loaded.
                  </p>
                ) : (
                  people.map((p) => {
                    const checked = (form.squadMemberIds ?? []).includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSquadMember(p.id)}
                        />
                        <span>
                          {p.nickname || p.nameEn}{" "}
                          <span className="text-muted-foreground">
                            · {p.jobTitle}
                          </span>
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              {errors.squadMemberIds ? (
                <p className="text-xs text-destructive">{errors.squadMemberIds}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brief">Brief</Label>
              <Textarea
                id="brief"
                value={form.brief}
                onChange={(e) => updateField("brief", e.target.value)}
                rows={2}
                placeholder="Creative brief, shot list notes…"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Dress Code</Label>
                <Select
                  value={form.dressCode ?? ""}
                  onValueChange={(v) => {
                    if (!v) {
                      setForm((prev) => {
                        const next = { ...prev };
                        delete next.dressCode;
                        return next;
                      });
                      return;
                    }
                    updateField("dressCode", v as DressCode);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {DRESS_CODES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.latePenaltyEnabled}
                    onChange={(e) =>
                      updateField("latePenaltyEnabled", e.target.checked)
                    }
                  />
                  Late Penalty
                </Label>
                {form.latePenaltyEnabled ? (
                  <div className="grid gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Amount (EGP)"
                      value={form.latePenaltyAmount || ""}
                      onChange={(e) =>
                        updateField(
                          "latePenaltyAmount",
                          Number(e.target.value) || 0
                        )
                      }
                      aria-invalid={!!errors.latePenaltyAmount}
                    />
                    <Input
                      placeholder="Reason"
                      value={form.latePenaltyReason}
                      onChange={(e) =>
                        updateField("latePenaltyReason", e.target.value)
                      }
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={2}
                placeholder="Special requirements, deliverables, etc."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Creating…" : "Create Order"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
