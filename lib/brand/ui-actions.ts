/**
 * Shared UI action labels — dual-language aware via i18n dictionaries.
 * Prefer useI18n().t("actions.*") in client components.
 * Server / non-hook callers can use getUiActions(locale).
 */

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

export function getUiActions(locale: Locale = DEFAULT_LOCALE) {
  const a = getDictionary(locale).actions;
  return {
    save: a.save,
    saving: a.saving,
    cancel: a.cancel,
    create: a.create,
    creating: a.creating,
    delete: a.delete,
    edit: a.edit,
    createClient: a.createClient,
    createOrder: a.createOrder,
    createProject: a.createProject,
    createPerson: a.createPerson,
    createCrew: a.createCrew,
    createQuotation: a.createQuotation,
    createDelivery: a.createDelivery,
    createInvoice: a.createInvoice,
    saveChanges: a.saveChanges,
    newClientTrigger: a.createClient,
    newOrderTrigger: a.createOrder,
  } as const;
}

/** Default English chrome — use hooks for live locale switching. */
export const UI_ACTIONS = getUiActions("en");
