/**
 * Execute Engine — Phase B of Operations Desk.
 *
 * RULES:
 * - Never runs without Founder Approve then Execute
 * - brain_save → Brain tables only
 * - erp_* → EXISTING ERP create functions only (createClient / createSmartOrder)
 * - Never invents new ERP inventories
 */

import { createClient } from "@/lib/clients/repository";
import type { Client } from "@/lib/clients/types";
import {
  createBrainEntry,
  appendBrainChatMessage,
  listBrainChatMessages,
  updateBrainEntry,
} from "@/lib/brain/repository";
import type { BrainUnderstanding } from "@/lib/brain/intelligence/types";
import type {
  BrainChatMessage,
  BrainEntry,
  MoneyKind,
} from "@/lib/brain/types";
import { createSmartOrder } from "@/lib/orders/engine";
import type { Order, ProjectType } from "@/lib/orders/types";
import { PROJECT_TYPES } from "@/lib/orders/types";

export type ExecuteEngineResult = {
  ok: boolean;
  error?: string;
  mode?: "brain" | "erp_client" | "erp_order";
  entry?: BrainEntry;
  client?: Client;
  order?: Order;
  messages?: BrainChatMessage[];
  messageAr?: string;
  messageEn?: string;
};

function assertApproved(u: BrainUnderstanding): string | null {
  if (u.lifecycle !== "approved") {
    return "لازم توافق الأول قبل التنفيذ.";
  }
  if (!u.canApprove) {
    return "لسه ناقص بيانات — كمّل المسودة الأول.";
  }
  return null;
}

function whoLabel(u: BrainUnderstanding): string {
  return (
    u.clientLabel?.trim() ||
    u.companyLabel?.trim() ||
    u.personLabel?.trim() ||
    "بدون اسم"
  );
}

async function saveBrainDraft(
  u: BrainUnderstanding,
  userId: string,
  locale: "ar" | "en",
  extraStructured?: Record<string, unknown>
): Promise<{ entry: BrainEntry; messages: BrainChatMessage[] }> {
  const moneyKind: MoneyKind | null =
    u.workspace === "money_memory" ? u.moneyKind : null;

  const structuredData: Record<string, unknown> = {
    source: "operations_desk",
    layer: "05.3",
    heuristic: true,
    intelligenceProvider: u.intelligenceProvider,
    intent: u.intent,
    executeTarget: u.executeTarget,
    lifecycle: "executed",
    reasons: u.reasons,
    entities: u.entities,
    potentialActions: u.potentialActions,
    erpAwareness: u.erpAwareness.map((h) => ({
      clientId: h.clientId,
      clientName: h.clientName,
      projectsCount: h.projectsCount,
      ordersCount: h.ordersCount,
    })),
    understanding: {
      workspace: u.workspace,
      moneyKind: u.moneyKind,
      moneyDirection: u.moneyDirection,
      amount: u.amount,
      currency: u.currency,
      personLabel: u.personLabel,
      companyLabel: u.companyLabel,
      clientLabel: u.clientLabel,
      phone: u.phone,
      shootDate: u.shootDate,
      projectType: u.projectType,
      confidence: u.confidence,
    },
    voice: u.voice,
    ...extraStructured,
  };

  const entry = await createBrainEntry(
    {
      workspace: u.workspace,
      title: u.title,
      body: u.rawText,
      rawText: u.rawText,
      moneyKind,
      amount: u.amount,
      amountNote: u.amount != null ? String(u.amount) : null,
      currency: u.currency,
      moneyDirection: u.moneyDirection,
      personLabel: u.personLabel,
      companyLabel: u.companyLabel,
      clientLabel: u.clientLabel,
      phone: u.phone,
      budgetNote: u.budgetNote,
      dueAt: u.dueAt ?? u.shootDate,
      priority: u.priority,
      reminderEnabled: u.reminderEnabled,
      status: u.status ?? undefined,
      classification: u.intent,
      classificationConfidence: u.confidence,
      classificationStatus: "classified",
      structuredData,
    },
    userId
  );

  const assistantText =
    locale === "ar" ? u.founderSummaryAr : u.founderSummaryEn;

  await appendBrainChatMessage({
    role: "user",
    content: u.rawText,
    classifiedWorkspace: u.workspace,
    entryId: entry.id,
    heuristicMeta: {
      reasons: u.reasons,
      confidence: u.confidence,
      intent: u.intent,
      lifecycle: "executed",
      operationsDesk: true,
    },
    createdBy: userId,
  });

  await appendBrainChatMessage({
    role: "assistant",
    content: assistantText,
    classifiedWorkspace: u.workspace,
    entryId: entry.id,
    heuristicMeta: {
      intelligence: true,
      operationsDesk: true,
      executeTarget: u.executeTarget,
      confidence: u.confidence,
    },
    createdBy: userId,
  });

  const messages = await listBrainChatMessages();
  return { entry, messages };
}

async function executeBrainSave(
  u: BrainUnderstanding,
  userId: string,
  locale: "ar" | "en"
): Promise<ExecuteEngineResult> {
  const { entry, messages } = await saveBrainDraft(u, userId, locale);
  return {
    ok: true,
    mode: "brain",
    entry,
    messages,
    messageAr: `اتحفظ في Brain. مفيش حاجة اتعملت في النظام.`,
    messageEn: `Saved to Brain. Nothing changed in the system.`,
  };
}

async function executeErpClient(
  u: BrainUnderstanding,
  userId: string,
  locale: "ar" | "en"
): Promise<ExecuteEngineResult> {
  const name = whoLabel(u);
  const phone = u.phone?.trim();
  if (!phone) {
    return { ok: false, error: "رقم الموبايل مطلوب لإنشاء عميل." };
  }

  const client = await createClient({
    type: /شركة|company|corp|llc/i.test(name) ? "company" : "individual",
    segment: "commercial",
    name,
    phone,
    whatsapp: phone,
    company: u.companyLabel ?? undefined,
    notes: `Created from Operations Desk draft.\n${u.rawText}`,
  });

  const { entry, messages } = await saveBrainDraft(u, userId, locale, {
    erpWrite: {
      target: "client",
      clientId: client.id,
      at: new Date().toISOString(),
    },
    promoteTarget: "client",
  });

  await updateBrainEntry(
    entry.id,
    {
      structuredData: {
        ...entry.structuredData,
        erpWrite: {
          target: "client",
          clientId: client.id,
          at: new Date().toISOString(),
        },
      },
    },
    userId
  );

  return {
    ok: true,
    mode: "erp_client",
    entry,
    client,
    messages,
    messageAr: `اتعمل عميل في النظام: ${client.name}. واتحفظت كمان في Brain.`,
    messageEn: `Client created in the system: ${client.name}. Also saved in Brain.`,
  };
}

function resolveProjectType(raw: string | null): ProjectType {
  if (raw && (PROJECT_TYPES as readonly string[]).includes(raw)) {
    return raw as ProjectType;
  }
  const lower = (raw ?? "").toLowerCase();
  if (/wedding|فرح|زواج/.test(lower)) return "Wedding";
  if (/engagement|خطوبة/.test(lower)) return "Engagement";
  if (/event|فعالية/.test(lower)) return "Event";
  if (/portrait|بورتريه/.test(lower)) return "Portrait";
  if (/product|منتج/.test(lower)) return "Product";
  return "Commercial";
}

async function executeErpOrder(
  u: BrainUnderstanding,
  userId: string,
  locale: "ar" | "en"
): Promise<ExecuteEngineResult> {
  const clientName = whoLabel(u);
  const phone = u.phone?.trim();
  if (!phone) {
    return { ok: false, error: "رقم الموبايل مطلوب لإنشاء أوردر." };
  }
  if (!u.shootDate?.trim()) {
    return { ok: false, error: "تاريخ التصور مطلوب." };
  }

  const projectType = resolveProjectType(u.projectType);
  const matched = u.erpAwareness[0];

  const result = await createSmartOrder({
    clientId: matched?.clientId,
    createNewClient: !matched?.clientId,
    clientName,
    phone,
    whatsapp: phone,
    projectType,
    workspaceId: "",
    shootDate: u.shootDate.trim(),
    location: "",
    deliveryDate: "",
    price: u.amount ?? 0,
    deposit: 0,
    team: "Studio A",
    squadMemberIds: [],
    status: "Holding",
    brief: u.rawText,
    notes: `Operations Desk draft · ${u.rawText}`,
    latePenaltyEnabled: false,
    latePenaltyAmount: 0,
    latePenaltyReason: "",
    packageName: "",
    deliverables: [],
    reelCount: 0,
    plannedExpenses: [],
  });

  const { entry, messages } = await saveBrainDraft(u, userId, locale, {
    erpWrite: {
      target: "order",
      orderId: result.order.id,
      clientId: result.order.clientId,
      at: new Date().toISOString(),
    },
  });

  return {
    ok: true,
    mode: "erp_order",
    entry,
    order: result.order,
    client: undefined,
    messages,
    messageAr: `اتعمل أوردر في النظام لـ ${result.order.clientName}. المسودة اتحفظت في Brain.`,
    messageEn: `Order created in the system for ${result.order.clientName}. Draft saved in Brain.`,
  };
}

/**
 * Founder-gated Execute. Caller must have already set lifecycle = approved.
 */
export async function runExecuteEngine(
  u: BrainUnderstanding,
  userId: string,
  locale: "ar" | "en" = "ar"
): Promise<ExecuteEngineResult> {
  const gate = assertApproved(u);
  if (gate) return { ok: false, error: gate };

  try {
    switch (u.executeTarget) {
      case "erp_create_client":
        return await executeErpClient(u, userId, locale);
      case "erp_create_order":
        return await executeErpOrder(u, userId, locale);
      case "brain_save":
      default:
        return await executeBrainSave(u, userId, locale);
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Execute failed.",
    };
  }
}
