"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Shield,
} from "lucide-react";

import { EditCrewProfileDialog } from "@/components/people/edit-crew-profile-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS, type SodaRole } from "@/lib/identity/roles";
import type { Person } from "@/lib/people/types";

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

function waHref(phone: string): string | null {
  const d = digitsOnly(phone);
  if (d.length < 8) return null;
  return `https://wa.me/${d}`;
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    /* ignore */
  }
}

function InteractiveCard({
  label,
  value,
  emptyHint,
  children,
}: {
  label: string;
  value: string | null | undefined;
  emptyHint?: string;
  children: React.ReactNode;
}) {
  const filled = Boolean(value?.trim());
  return (
    <div className="space-y-2 rounded-xl border border-border/50 bg-card/30 px-3.5 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p
            className={
              filled ? "text-sm font-medium break-all" : "text-sm text-muted-foreground"
            }
          >
            {filled ? value : emptyHint ?? "— empty until recorded"}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

interface InteractiveProfileCardsProps {
  person: Person;
  linkedRole: SodaRole | null;
  canEdit: boolean;
}

export function InteractiveProfileCards({
  person,
  linkedRole,
  canEdit,
}: InteractiveProfileCardsProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [focusField, setFocusField] = useState<
    "phone" | "email" | "department" | "role" | null
  >(null);

  function openEdit(field: "phone" | "email" | "department" | "role") {
    if (!canEdit) return;
    setFocusField(field);
    setEditOpen(true);
  }

  const phone = person.phone?.trim() || "";
  const email = person.email?.trim() || "";
  const department = person.department?.trim() || "";
  const wa = phone ? waHref(phone) : null;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <InteractiveCard label="Phone" value={phone || null}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="shrink-0" />
              }
            >
              ···
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit ? (
                <DropdownMenuItem onClick={() => openEdit("phone")}>
                  <Pencil className="size-3.5" />
                  Edit
                </DropdownMenuItem>
              ) : null}
              {phone ? (
                <DropdownMenuItem onClick={() => void copyText(phone)}>
                  <Copy className="size-3.5" />
                  Copy
                </DropdownMenuItem>
              ) : null}
              {phone ? (
                <DropdownMenuItem
                  nativeButton={false}
                  render={<a href={`tel:${digitsOnly(phone)}`} />}
                >
                  <Phone className="size-3.5" />
                  Call
                </DropdownMenuItem>
              ) : null}
              {wa ? (
                <DropdownMenuItem
                  nativeButton={false}
                  render={
                    <a href={wa} target="_blank" rel="noopener noreferrer" />
                  }
                >
                  <MessageCircle className="size-3.5" />
                  WhatsApp
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </InteractiveCard>

        <InteractiveCard label="Email" value={email || null}>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="shrink-0" />
              }
            >
              ···
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit ? (
                <DropdownMenuItem onClick={() => openEdit("email")}>
                  <Pencil className="size-3.5" />
                  Edit
                </DropdownMenuItem>
              ) : null}
              {email ? (
                <DropdownMenuItem onClick={() => void copyText(email)}>
                  <Copy className="size-3.5" />
                  Copy
                </DropdownMenuItem>
              ) : null}
              {email ? (
                <DropdownMenuItem
                  nativeButton={false}
                  render={<a href={`mailto:${email}`} />}
                >
                  <Mail className="size-3.5" />
                  Mail
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </InteractiveCard>

        <InteractiveCard label="Department" value={department || null}>
          {canEdit ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              onClick={() => openEdit("department")}
              aria-label="Edit department"
            >
              <Pencil className="size-3.5" />
            </Button>
          ) : null}
        </InteractiveCard>

        <InteractiveCard
          label="Role"
          value={linkedRole ? ROLE_LABELS[linkedRole] : null}
          emptyHint="No linked Auth role yet"
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="shrink-0" />
              }
            >
              ···
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit ? (
                <DropdownMenuItem onClick={() => openEdit("role")}>
                  <Pencil className="size-3.5" />
                  Change Role
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                nativeButton={false}
                render={<Link href="/settings/authority" />}
              >
                <Shield className="size-3.5" />
                Manage Permissions
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </InteractiveCard>
      </div>

      {canEdit ? (
        <EditCrewProfileDialog
          person={person}
          open={editOpen}
          onOpenChange={setEditOpen}
          focusField={focusField}
        />
      ) : null}
    </>
  );
}
