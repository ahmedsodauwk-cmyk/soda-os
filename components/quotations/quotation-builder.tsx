"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  FileDown,
  Plus,
  Trash2,
  CheckCircle2,
  Banknote,
  FolderKanban,
} from "lucide-react";

import { VersionHistory } from "@/components/quotations/version-history";
import { HumanExplanation } from "@/components/brand/human-title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { runQuotationConversionFlow } from "@/lib/integration";
import {
  APPROVAL_STATUSES,
  canConvertQuotation,
  computeQuotationTotals,
  formatEgp,
  formatShortDate,
  generateLineId,
  getQuotationById,
  markDepositReceived,
  PIPELINE_STAGES,
  restoreQuotationVersion,
  setQuotationApprovalStatus,
  updateQuotation,
  type ApprovalStatus,
  type PipelineStage,
  type Quotation,
  type QuotationLineItem,
} from "@/lib/quotations";
import type { HumanLayerKey } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface QuotationBuilderProps {
  quotationId: string;
}

function SectionHead({
  title,
  layer,
}: {
  title: string;
  layer: HumanLayerKey;
}) {
  return (
    <div className="space-y-1">
      <CardTitle className="text-base">{title}</CardTitle>
      <HumanExplanation layer={layer} size="compact" />
    </div>
  );
}

function emptyLine(): QuotationLineItem {
  return {
    id: generateLineId(),
    name: "",
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}

function LineEditor({
  title,
  rows,
  disabled,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string;
  rows: QuotationLineItem[];
  disabled: boolean;
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<QuotationLineItem>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1"
          disabled={disabled}
          onClick={onAdd}
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No items yet. Add a line to build the quote.
          </p>
        ) : (
          rows.map((item) => (
            <div
              key={item.id}
              className="grid gap-2 rounded-lg border border-border/50 p-2.5 sm:grid-cols-[1fr_70px_110px_auto]"
            >
              <div className="space-y-1.5">
                <Input
                  placeholder="Item name"
                  value={item.name}
                  disabled={disabled}
                  onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                />
                <Input
                  placeholder="Description (optional)"
                  value={item.description ?? ""}
                  disabled={disabled}
                  onChange={(e) =>
                    onUpdate(item.id, { description: e.target.value })
                  }
                />
              </div>
              <Input
                type="number"
                min={1}
                value={item.quantity}
                disabled={disabled}
                onChange={(e) =>
                  onUpdate(item.id, { quantity: Number(e.target.value) || 0 })
                }
              />
              <Input
                type="number"
                min={0}
                value={item.unitPrice}
                disabled={disabled}
                onChange={(e) =>
                  onUpdate(item.id, { unitPrice: Number(e.target.value) || 0 })
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                onClick={() => onRemove(item.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function QuotationBuilder({ quotationId }: QuotationBuilderProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Quotation | null>(() => {
    const q = getQuotationById(quotationId);
    return q ? structuredClone(q) : null;
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const totals = useMemo(
    () => (draft ? computeQuotationTotals(draft) : null),
    [draft]
  );

  if (!draft) {
    return (
      <p className="text-sm text-muted-foreground">Quotation not found.</p>
    );
  }

  const q = draft;
  const converted = q.approvalStatus === "Converted";
  const convertible = canConvertQuotation(q);

  function patchDraft(partial: Partial<Quotation>) {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  function save(changeSummary?: string) {
    const saved = updateQuotation(
      q.id,
      {
        clientName: q.clientName,
        company: q.company,
        contactName: q.contactName,
        contactPhone: q.contactPhone,
        contactEmail: q.contactEmail,
        segment: q.segment,
        category: q.category,
        estimatedValue: q.estimatedValue,
        probability: q.probability,
        expectedClosingDate: q.expectedClosingDate,
        assignedSales: q.assignedSales,
        notes: q.notes,
        projectInfo: q.projectInfo,
        services: q.services,
        items: q.items,
        optionalItems: q.optionalItems,
        discount: q.discount,
        taxRate: q.taxRate,
        timeline: q.timeline,
        deliverables: q.deliverables,
        paymentPlan: q.paymentPlan,
        terms: q.terms,
        builderNotes: q.builderNotes,
        attachments: q.attachments,
      },
      {
        editedBy: q.assignedSales || "Junior Soda",
        saveVersion: true,
        changeSummary,
      }
    );
    if (saved) {
      setDraft(structuredClone(saved));
      setMessage("Saved");
      setError(null);
      setTimeout(() => setMessage(null), 2000);
    }
  }

  function updateItem(
    field: "items" | "optionalItems",
    id: string,
    patch: Partial<QuotationLineItem>
  ) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: prev[field].map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      };
    });
  }

  function addItem(field: "items" | "optionalItems") {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, [field]: [...prev[field], emptyLine()] };
    });
  }

  function removeItem(field: "items" | "optionalItems", id: string) {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: prev[field].filter((item) => item.id !== id),
      };
    });
  }

  function handleStatus(status: ApprovalStatus) {
    const updated = setQuotationApprovalStatus(
      q.id,
      status,
      q.assignedSales
    );
    if (updated) {
      setDraft(structuredClone(updated));
      setMessage(`Status → ${status}`);
    }
  }

  function handleStage(stage: PipelineStage) {
    const updated = updateQuotation(
      q.id,
      { pipelineStage: stage },
      { editedBy: q.assignedSales, saveVersion: false }
    );
    if (updated) setDraft(structuredClone(updated));
  }

  function handleDeposit() {
    const updated = markDepositReceived(q.id, q.assignedSales);
    if (updated) {
      setDraft(structuredClone(updated));
      setMessage("Deposit marked received");
    }
  }

  async function handleConvert() {
    try {
      const result = await runQuotationConversionFlow(q.id, {
        editedBy: q.assignedSales,
      });
      const refreshed = getQuotationById(q.id);
      if (refreshed) setDraft(structuredClone(refreshed));
      setMessage(`Converted → ${result.projectId} / ${result.orderId}`);
      setError(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Convert failed");
    }
  }

  function handleRestore(version: number) {
    const restored = restoreQuotationVersion(
      q.id,
      version,
      q.assignedSales
    );
    if (restored) {
      setDraft(structuredClone(restored));
      setMessage(`Restored version ${version}`);
    }
  }

  function handlePrint() {
    setShowPreview(true);
    setTimeout(() => window.print(), 100);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1.5"
          nativeButton={false}
          render={<Link href="/quotations" />}
        >
          <ArrowLeft className="size-4" />
          Quotations
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {message ? (
            <span className="text-xs text-emerald-600">{message}</span>
          ) : null}
          {error ? <span className="text-xs text-red-500">{error}</span> : null}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handlePrint}
          >
            <FileDown className="size-3.5" />
            PDF / Print
          </Button>
          <Button
            size="sm"
            disabled={converted}
            onClick={() => save("Builder save")}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-muted-foreground">
            {draft.number} · v{draft.currentVersion}
          </p>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {draft.projectInfo.title || draft.clientName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {draft.clientName}
            {draft.company ? ` · ${draft.company}` : ""} · {draft.contactName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Badge variant="outline">{draft.pipelineStage}</Badge>
          <Badge variant="secondary">{draft.approvalStatus}</Badge>
          {totals ? (
            <Badge className="bg-soda-pink text-soda-action-foreground">
              {formatEgp(totals.total || draft.estimatedValue)}
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Approval + convert actions */}
      <Card className="print:hidden">
        <CardHeader className="pb-2">
          <SectionHead title="Approval & conversion" layer="quotationApproval" />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Select
            value={draft.approvalStatus}
            onValueChange={(v) => {
              if (v) handleStatus(v as ApprovalStatus);
            }}
          >
            <SelectTrigger className="h-8 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPROVAL_STATUSES.map((s) => (
                <SelectItem key={s} value={s} disabled={converted && s !== "Converted"}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={draft.pipelineStage}
            onValueChange={(v) => {
              if (v) handleStage(v as PipelineStage);
            }}
          >
            <SelectTrigger className="h-8 w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={converted || Boolean(draft.statusTimestamps["Deposit Received"])}
            onClick={handleDeposit}
          >
            <Banknote className="size-3.5" />
            Mark deposit received
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!convertible}
            onClick={handleConvert}
          >
            <FolderKanban className="size-3.5" />
            Convert to project
          </Button>
          {draft.convertedProjectId ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              nativeButton={false}
              render={<Link href={`/projects/${draft.convertedProjectId}`} />}
            >
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              Open project
            </Button>
          ) : null}
        </CardContent>
        <div className="border-t border-border/50 px-6 py-3 text-xs text-muted-foreground">
          Timestamps:{" "}
          {Object.entries(draft.statusTimestamps)
            .map(([k, v]) => `${k} ${formatShortDate(v.slice(0, 10))}`)
            .join(" · ") || "—"}
        </div>
      </Card>

      <div className={cn("grid gap-4 lg:grid-cols-2", showPreview && "print:hidden")}>
        {/* Project info */}
        <Card>
          <CardHeader className="pb-2">
            <SectionHead title="Project info" layer="quotationProjectInfo" />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Title</Label>
              <Input
                value={draft.projectInfo.title}
                disabled={converted}
                onChange={(e) =>
                  patchDraft({
                    projectInfo: {
                      ...draft.projectInfo,
                      title: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Input
                value={draft.clientName}
                disabled={converted}
                onChange={(e) => patchDraft({ clientName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input
                value={draft.company ?? ""}
                disabled={converted}
                onChange={(e) => patchDraft({ company: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contact</Label>
              <Input
                value={draft.contactName}
                disabled={converted}
                onChange={(e) => patchDraft({ contactName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input
                value={draft.category}
                disabled={converted}
                onChange={(e) => patchDraft({ category: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input
                value={draft.projectInfo.location ?? ""}
                disabled={converted}
                onChange={(e) =>
                  patchDraft({
                    projectInfo: {
                      ...draft.projectInfo,
                      location: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Assigned sales</Label>
              <Input
                value={draft.assignedSales}
                disabled={converted}
                onChange={(e) => patchDraft({ assignedSales: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Probability %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={draft.probability}
                disabled={converted}
                onChange={(e) =>
                  patchDraft({ probability: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Expected close</Label>
              <Input
                type="date"
                value={draft.expectedClosingDate}
                disabled={converted}
                onChange={(e) =>
                  patchDraft({ expectedClosingDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Shoot date</Label>
              <Input
                type="date"
                value={draft.projectInfo.shootDate ?? ""}
                disabled={converted}
                onChange={(e) =>
                  patchDraft({
                    projectInfo: {
                      ...draft.projectInfo,
                      shootDate: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Delivery date</Label>
              <Input
                type="date"
                value={draft.projectInfo.deliveryDate ?? ""}
                disabled={converted}
                onChange={(e) =>
                  patchDraft({
                    projectInfo: {
                      ...draft.projectInfo,
                      deliveryDate: e.target.value,
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Services + notes */}
        <Card>
          <CardHeader className="pb-2">
            <SectionHead title="Services & notes" layer="quotationServices" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Services (comma-separated)</Label>
              <Input
                value={draft.services.join(", ")}
                disabled={converted}
                onChange={(e) =>
                  patchDraft({
                    services: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Internal notes</Label>
              <Textarea
                value={draft.notes}
                disabled={converted}
                rows={3}
                onChange={(e) => patchDraft({ notes: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Builder notes</Label>
              <Textarea
                value={draft.builderNotes}
                disabled={converted}
                rows={2}
                onChange={(e) => patchDraft({ builderNotes: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Attachments</Label>
              {draft.attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">None</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {draft.attachments.map((a) => (
                    <li key={a.id} className="rounded-md border border-border/50 px-2 py-1.5">
                      {a.name} · {a.size}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 print:hidden">
        <LineEditor
          title="Items"
          rows={draft.items}
          disabled={converted}
          onAdd={() => addItem("items")}
          onUpdate={(id, patch) => updateItem("items", id, patch)}
          onRemove={(id) => removeItem("items", id)}
        />
        <LineEditor
          title="Optional items"
          rows={draft.optionalItems}
          disabled={converted}
          onAdd={() => addItem("optionalItems")}
          onUpdate={(id, patch) => updateItem("optionalItems", id, patch)}
          onRemove={(id) => removeItem("optionalItems", id)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 print:hidden">
        <Card>
          <CardHeader className="pb-2">
            <SectionHead title="Discount & tax" layer="quotationDiscountTax" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Discount type</Label>
                <Select
                  value={draft.discount.type}
                  onValueChange={(v) => {
                    if (!v) return;
                    patchDraft({
                      discount: {
                        ...draft.discount,
                        type: v as "percent" | "fixed",
                      },
                    });
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percent</SelectItem>
                    <SelectItem value="fixed">Fixed EGP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Discount value</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.discount.value}
                  disabled={converted}
                  onChange={(e) =>
                    patchDraft({
                      discount: {
                        ...draft.discount,
                        value: Number(e.target.value) || 0,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tax rate %</Label>
              <Input
                type="number"
                min={0}
                value={draft.taxRate}
                disabled={converted}
                onChange={(e) =>
                  patchDraft({ taxRate: Number(e.target.value) || 0 })
                }
              />
            </div>
            {totals ? (
              <div className="space-y-1 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                <p className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatEgp(totals.subtotal)}</span>
                </p>
                <p className="flex justify-between">
                  <span>After discount</span>
                  <span className="font-mono">
                    {formatEgp(totals.afterDiscount)}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Tax</span>
                  <span className="font-mono">{formatEgp(totals.tax)}</span>
                </p>
                <p className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="font-mono">{formatEgp(totals.total)}</span>
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <SectionHead title="Timeline" layer="quotationTimeline" />
          </CardHeader>
          <CardContent className="grid gap-2">
            {(
              [
                ["discoveryDate", "Discovery"],
                ["shootDate", "Shoot"],
                ["firstDeliveryDate", "First delivery"],
                ["finalDeliveryDate", "Final delivery"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  type="date"
                  value={draft.timeline[key] ?? ""}
                  disabled={converted}
                  onChange={(e) =>
                    patchDraft({
                      timeline: { ...draft.timeline, [key]: e.target.value },
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <SectionHead title="Deliverables" layer="quotationDeliverables" />
          </CardHeader>
          <CardContent>
            <Textarea
              rows={8}
              value={draft.deliverables.join("\n")}
              disabled={converted}
              placeholder="One deliverable per line"
              onChange={(e) =>
                patchDraft({
                  deliverables: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 print:hidden">
        <Card>
          <CardHeader className="pb-2">
            <SectionHead title="Payment plan" layer="quotationPaymentPlan" />
          </CardHeader>
          <CardContent className="space-y-2">
            {draft.paymentPlan.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No payment milestones yet.
              </p>
            ) : (
              draft.paymentPlan.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.percent}% · {p.dueLabel}
                    </p>
                  </div>
                  <span className="font-mono">{formatEgp(p.amount)}</span>
                </div>
              ))
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={converted}
              onClick={() => {
                const total = totals?.total || draft.estimatedValue || 0;
                patchDraft({
                  paymentPlan: [
                    {
                      id: generateLineId("pp"),
                      label: "Deposit",
                      percent: 40,
                      amount: Math.round(total * 0.4),
                      dueLabel: "On approval",
                    },
                    {
                      id: generateLineId("pp"),
                      label: "Final",
                      percent: 60,
                      amount: Math.round(total * 0.6),
                      dueLabel: "On delivery",
                    },
                  ],
                });
              }}
            >
              Generate 40/60 plan from total
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <SectionHead title="Terms" layer="quotationTerms" />
          </CardHeader>
          <CardContent>
            <Textarea
              rows={8}
              value={draft.terms}
              disabled={converted}
              onChange={(e) => patchDraft({ terms: e.target.value })}
            />
          </CardContent>
        </Card>
      </div>

      <div className="print:hidden">
        <VersionHistory
          versions={draft.versions}
          currentVersion={draft.currentVersion}
          onRestore={handleRestore}
          disabled={converted}
        />
      </div>

      {/* Print-friendly preview */}
      <Card className="quotation-print-preview">
        <CardHeader className="pb-2">
          <SectionHead title="Preview" layer="quotationPreview" />
          <p className="text-xs text-muted-foreground print:hidden">
            Print / PDF export uses this structured preview.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap justify-between gap-3 border-b border-border/60 pb-3">
            <div>
              <p className="font-heading text-lg font-semibold">SODA Visuals</p>
              <p className="text-muted-foreground">Quotation {draft.number}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">{draft.clientName}</p>
              <p className="text-muted-foreground">{draft.contactName}</p>
              {draft.contactEmail ? (
                <p className="text-muted-foreground">{draft.contactEmail}</p>
              ) : null}
            </div>
          </div>
          <div>
            <p className="font-medium">{draft.projectInfo.title}</p>
            <p className="text-muted-foreground">
              {[draft.projectInfo.location, draft.category]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          {draft.items.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-1 font-medium">Item</th>
                  <th className="py-1 font-medium">Qty</th>
                  <th className="py-1 font-medium">Unit</th>
                  <th className="py-1 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {draft.items.map((item) => (
                  <tr key={item.id} className="border-b border-border/40">
                    <td className="py-1.5">
                      <p>{item.name || "—"}</p>
                      {item.description ? (
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-1.5">{item.quantity}</td>
                    <td className="py-1.5 font-mono text-xs">
                      {formatEgp(item.unitPrice)}
                    </td>
                    <td className="py-1.5 text-right font-mono text-xs">
                      {formatEgp(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground">No line items.</p>
          )}
          {totals ? (
            <div className="ml-auto w-full max-w-xs space-y-1">
              <p className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">{formatEgp(totals.subtotal)}</span>
              </p>
              <p className="flex justify-between">
                <span>Tax ({draft.taxRate}%)</span>
                <span className="font-mono">{formatEgp(totals.tax)}</span>
              </p>
              <p className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="font-mono">{formatEgp(totals.total)}</span>
              </p>
            </div>
          ) : null}
          {draft.deliverables.length > 0 ? (
            <div>
              <p className="mb-1 font-medium">Deliverables</p>
              <ul className="list-inside list-disc text-muted-foreground">
                {draft.deliverables.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {draft.terms ? (
            <div>
              <p className="mb-1 font-medium">Terms</p>
              <pre className="whitespace-pre-wrap font-sans text-xs text-muted-foreground">
                {draft.terms}
              </pre>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
