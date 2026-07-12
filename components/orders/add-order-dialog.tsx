"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, UserPlus } from "lucide-react";

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
import { UI_ACTIONS } from "@/lib/brand/ui-actions";
import {
  createClientInline,
  getClientOrderContext,
  type ClientOrderContext,
} from "@/lib/orders/engine";
import {
  DRESS_CODES,
  ORDER_DELIVERABLES,
  ORDER_PACKAGES,
  ORDER_STATUSES,
  PLANNED_EXPENSE_KINDS,
  PROJECT_TYPES,
  TEAMS,
  type DressCode,
  type OrderDeliverable,
  type OrderStatus,
  type PlannedExpenseKind,
  type PlannedExpenseLine,
  type ProjectType,
  type SmartOrderInput,
} from "@/lib/orders/types";
import { formatPrice, workspaceIdFromProjectType } from "@/lib/orders/utils";
import { validateSmartOrderInput } from "@/lib/orders/validation";
import { getPeople } from "@/lib/people/repository";
import { getProjectsByClient } from "@/lib/projects/repository";
import { getProjectOperatingView } from "@/lib/integration";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Client & Package" },
  { id: 2, title: "Team" },
  { id: 3, title: "Deliverables" },
  { id: 4, title: "Expenses" },
  { id: 5, title: "Review" },
] as const;

type FormState = SmartOrderInput & {
  createNewClient: boolean;
  createNewProject: boolean;
  projectName: string;
  memberSalaries: Record<string, number>;
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
    packageName: "Classic",
    deliverables: [],
    reelCount: 0,
    plannedExpenses: PLANNED_EXPENSE_KINDS.map((kind) => ({
      kind,
      amount: 0,
    })),
    memberSalaries: {},
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
  triggerLabel = UI_ACTIONS.createOrder,
}: AddOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
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

  const hasReels = (form.deliverables ?? []).includes("Reels");
  const plannedTotal = (form.plannedExpenses ?? []).reduce(
    (a, l) => a + (Number(l.amount) || 0),
    0
  );
  const salaryTotal = (form.squadMemberIds ?? []).reduce(
    (a, id) => a + (Number(form.memberSalaries[id]) || 0),
    0
  );

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
      const salaries = { ...prev.memberSalaries };
      if (set.has(personId)) {
        set.delete(personId);
        delete salaries[personId];
      } else {
        set.add(personId);
        if (salaries[personId] == null) salaries[personId] = 0;
      }
      return { ...prev, squadMemberIds: [...set], memberSalaries: salaries };
    });
  }

  function toggleDeliverable(item: OrderDeliverable) {
    setForm((prev) => {
      const set = new Set(prev.deliverables ?? []);
      if (set.has(item)) set.delete(item);
      else set.add(item);
      const deliverables = [...set] as OrderDeliverable[];
      return {
        ...prev,
        deliverables,
        reelCount: deliverables.includes("Reels") ? prev.reelCount : 0,
      };
    });
  }

  function updatePlanned(
    kind: PlannedExpenseKind,
    amount: number,
    notes?: string
  ) {
    setForm((prev) => {
      const lines = [...(prev.plannedExpenses ?? [])];
      const idx = lines.findIndex((l) => l.kind === kind);
      const next: PlannedExpenseLine = {
        kind,
        amount,
        ...(notes ? { notes } : {}),
      };
      if (idx >= 0) lines[idx] = { ...lines[idx], ...next };
      else lines.push(next);
      return { ...prev, plannedExpenses: lines };
    });
  }

  function validateStep(s: number): boolean {
    const next: Partial<Record<string, string>> = {};
    if (s === 1) {
      if (!form.clientName?.trim() && !form.clientId) {
        next.clientName = "Client is required";
      }
      if (form.createNewClient && !form.phone?.trim()) {
        next.phone = "Phone is required";
      }
      if (!form.projectType) next.projectType = "Project type is required";
      if (!form.shootDate?.trim()) next.shootDate = "Shoot date is required";
      if (!form.packageName?.trim()) next.packageName = "Package is required";
      if (!Number.isFinite(form.price) || form.price <= 0) {
        next.price = "Agreed price must be greater than 0";
      }
    }
    if (s === 2) {
      if (!form.team?.trim()) next.team = "Squad name is required";
    }
    if (s === 3) {
      if (hasReels && (!form.reelCount || form.reelCount <= 0)) {
        next.reelCount = "Enter reel count";
      }
    }
    if (s === 5) {
      const all = validateSmartOrderInput(form);
      Object.assign(next, all);
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(5, s + 1));
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep(5)) return;
    setSaving(true);
    try {
      let payload: SmartOrderInput = {
        ...form,
        memberSalaries: form.memberSalaries,
        plannedExpenses: (form.plannedExpenses ?? []).filter(
          (l) => (Number(l.amount) || 0) > 0
        ),
      };
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
      setStep(1);
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
      setStep(1);
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
        <DialogTrigger render={<Button className="cursor-pointer gap-1.5" />}>
          {triggerLabel}
        </DialogTrigger>

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Order</DialogTitle>
            <DialogDescription>
              Step {step} of 5 — {STEPS[step - 1]?.title}
            </DialogDescription>
          </DialogHeader>

          <nav className="flex flex-wrap gap-1.5" aria-label="Wizard steps">
            {STEPS.map((s) => (
              <span
                key={s.id}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px]",
                  s.id === step
                    ? "bg-soda-pink/15 text-soda-pink"
                    : s.id < step
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground"
                )}
              >
                {s.id}. {s.title}
              </span>
            ))}
          </nav>

          <form onSubmit={handleSubmit} className="grid gap-4">
            {errors.form ? (
              <p className="text-xs text-destructive">{errors.form}</p>
            ) : null}

            {step === 1 ? (
              <>
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
                        <p className="text-xs text-destructive">
                          {errors.clientName}
                        </p>
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
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={form.whatsapp}
                        onChange={(e) =>
                          updateField("whatsapp", e.target.value)
                        }
                        disabled={phoneLocked && !form.createNewClient}
                        placeholder="Same as phone if empty"
                      />
                    </div>
                  </div>
                  {clientCtx ? (
                    <p className="text-xs text-muted-foreground">
                      Previous orders: {clientCtx.previousOrders.length} ·
                      Outstanding:{" "}
                      {clientCtx.outstanding.toLocaleString("en-EG")} EGP
                    </p>
                  ) : null}
                </div>

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
                          return (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} · {p.status} ·{" "}
                              {formatPrice(op.finance.revenue)}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={form.projectName}
                      onChange={(e) =>
                        updateField("projectName", e.target.value)
                      }
                      placeholder="New project name (optional)"
                    />
                  )}
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
                      <SelectTrigger>
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
                    <Label>Package</Label>
                    <Select
                      value={form.packageName || "Classic"}
                      onValueChange={(v) => {
                        if (v) updateField("packageName", v);
                      }}
                    >
                      <SelectTrigger aria-invalid={!!errors.packageName}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_PACKAGES.map((pkg) => (
                          <SelectItem key={pkg} value={pkg}>
                            {pkg}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="shootDate">Shoot Date</Label>
                    <Input
                      id="shootDate"
                      type="date"
                      value={form.shootDate}
                      onChange={(e) =>
                        updateField("shootDate", e.target.value)
                      }
                      aria-invalid={!!errors.shootDate}
                    />
                    {errors.shootDate ? (
                      <p className="text-xs text-destructive">
                        {errors.shootDate}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="deliveryDate">Delivery Date</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={form.deliveryDate}
                      onChange={(e) =>
                        updateField("deliveryDate", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={form.location}
                      onChange={(e) => updateField("location", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="price">Agreed Price (EGP)</Label>
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
                    <p className="text-[11px] text-muted-foreground">
                      Agreed price is not revenue — revenue is collected cash.
                    </p>
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
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) => {
                        if (value) updateField("status", value as OrderStatus);
                      }}
                    >
                      <SelectTrigger>
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

                <div className="space-y-1.5">
                  <Label htmlFor="brief">Brief</Label>
                  <Textarea
                    id="brief"
                    value={form.brief}
                    onChange={(e) => updateField("brief", e.target.value)}
                    rows={2}
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
                      Late Policy
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
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    rows={2}
                    placeholder="Free-form notes only — not structured fields"
                  />
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Squad Name</Label>
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
                <div className="space-y-2">
                  <Label>Crew + salary (EGP)</Label>
                  <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-border/50 p-2">
                    {people.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No active crew members loaded.
                      </p>
                    ) : (
                      people.map((p) => {
                        const checked = (form.squadMemberIds ?? []).includes(
                          p.id
                        );
                        return (
                          <div
                            key={p.id}
                            className="flex flex-wrap items-center gap-2 text-sm"
                          >
                            <label className="flex min-w-[10rem] flex-1 cursor-pointer items-center gap-2">
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
                            {checked ? (
                              <Input
                                type="number"
                                min={0}
                                className="h-8 w-28"
                                value={form.memberSalaries[p.id] || ""}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    memberSalaries: {
                                      ...prev.memberSalaries,
                                      [p.id]: Number(e.target.value) || 0,
                                    },
                                  }))
                                }
                                placeholder="Salary"
                              />
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Crew salaries total: {formatPrice(salaryTotal)}
                  </p>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-3">
                <Label>Deliverables</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ORDER_DELIVERABLES.map((d) => {
                    const checked = (form.deliverables ?? []).includes(d);
                    return (
                      <label
                        key={d}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-border/50 px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDeliverable(d)}
                        />
                        {d}
                      </label>
                    );
                  })}
                </div>
                {hasReels ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="reelCount">Reel count</Label>
                    <Input
                      id="reelCount"
                      type="number"
                      min={1}
                      value={form.reelCount || ""}
                      onChange={(e) =>
                        updateField("reelCount", Number(e.target.value) || 0)
                      }
                      aria-invalid={!!errors.reelCount}
                    />
                    {errors.reelCount ? (
                      <p className="text-xs text-destructive">
                        {errors.reelCount}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-3">
                <Label>Planned expenses</Label>
                <p className="text-xs text-muted-foreground">
                  Estimates only — actuals are logged after the shoot.
                </p>
                {PLANNED_EXPENSE_KINDS.map((kind) => {
                  const line = (form.plannedExpenses ?? []).find(
                    (l) => l.kind === kind
                  );
                  return (
                    <div
                      key={kind}
                      className="grid gap-2 sm:grid-cols-[1fr_8rem]"
                    >
                      <Label className="capitalize self-center">{kind}</Label>
                      <Input
                        type="number"
                        min={0}
                        value={line?.amount || ""}
                        onChange={(e) =>
                          updatePlanned(kind, Number(e.target.value) || 0)
                        }
                        placeholder="0"
                      />
                    </div>
                  );
                })}
                <p className="text-xs text-muted-foreground">
                  Planned total: {formatPrice(plannedTotal)}
                </p>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-3 rounded-md border border-border/60 p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Client:</span>{" "}
                  {form.clientName || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Package:</span>{" "}
                  {form.packageName || "—"} · {form.projectType}
                </p>
                <p>
                  <span className="text-muted-foreground">Shoot:</span>{" "}
                  {form.shootDate || "—"} · {form.location || "TBD"}
                </p>
                <p>
                  <span className="text-muted-foreground">Agreed price:</span>{" "}
                  {formatPrice(form.price)}{" "}
                  <span className="text-xs text-muted-foreground">
                    (not revenue)
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Squad:</span>{" "}
                  {form.team}
                  {(form.squadMemberIds?.length ?? 0) > 0
                    ? ` · ${form.squadMemberIds!.length} crew · ${formatPrice(salaryTotal)}`
                    : ""}
                </p>
                <p>
                  <span className="text-muted-foreground">Deliverables:</span>{" "}
                  {(form.deliverables ?? []).join(", ") || "None"}
                  {hasReels ? ` (${form.reelCount} reels)` : ""}
                </p>
                <p>
                  <span className="text-muted-foreground">
                    Planned expenses:
                  </span>{" "}
                  {formatPrice(plannedTotal)}
                </p>
                {form.brief ? (
                  <p>
                    <span className="text-muted-foreground">Brief:</span>{" "}
                    {form.brief}
                  </p>
                ) : null}
              </div>
            ) : null}

            <DialogFooter className="gap-2 sm:justify-between">
              <div className="flex gap-2">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={goBack}>
                    <ChevronLeft className="size-4" />
                    Back
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    {UI_ACTIONS.cancel}
                  </Button>
                )}
              </div>
              {step < 5 ? (
                <Button type="button" onClick={goNext}>
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={saving}>
                  {saving ? UI_ACTIONS.creating : "Create Order"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
