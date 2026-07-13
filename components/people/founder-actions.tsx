"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Camera,
  KeyRound,
  Pencil,
  Shield,
  UserMinus,
  Briefcase,
} from "lucide-react";

import { AssignWorkDialog } from "@/components/people/assign-work-dialog";
import { EditCrewProfileDialog } from "@/components/people/edit-crew-profile-dialog";
import { Button } from "@/components/ui/button";
import {
  resetCrewPasswordAction,
  setCrewStatusAction,
} from "@/lib/people/actions";
import type { Person } from "@/lib/people/types";

interface FounderActionsProps {
  person: Person;
}

/**
 * Founder / Admin only controls for Crew Workspace.
 * Parent must gate rendering — this component assumes authorization.
 */
export function FounderActions({ person }: FounderActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleResetPassword() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await resetCrewPasswordAction(person.id);
      if (!result.ok) {
        setMessage(result.error ?? "Reset failed.");
        return;
      }
      const temp = result.tempPassword
        ? ` Temp: ${result.tempPassword}`
        : "";
      setMessage((result.message ?? "Password reset.") + temp);
    } finally {
      setBusy(false);
    }
  }

  async function handleArchive() {
    if (
      !window.confirm(
        `Archive ${person.displayName || person.nameEn}? They leave the active roster but the record stays.`
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await setCrewStatusAction(person.id, "inactive", "archive");
      setMessage(result.ok ? result.message ?? "Archived." : result.error ?? "Failed.");
      if (result.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDeactivate() {
    if (
      !window.confirm(
        `Deactivate ${person.displayName || person.nameEn}? Linked Auth (if any) will be marked inactive.`
      )
    ) {
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await setCrewStatusAction(
        person.id,
        "inactive",
        "deactivate"
      );
      setMessage(
        result.ok ? result.message ?? "Deactivated." : result.error ?? "Failed."
      );
      if (result.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        Founder Actions
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={busy}
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="size-3.5" />
          Edit Profile
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={busy}
          onClick={() => setAssignOpen(true)}
        >
          <Briefcase className="size-3.5" />
          Assign Work
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          nativeButton={false}
          render={<Link href="/settings/authority" />}
        >
          <Shield className="size-3.5" />
          Manage Permissions
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={busy}
          onClick={() => setPhotoOpen(true)}
        >
          <Camera className="size-3.5" />
          Upload Profile Photo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={busy}
          onClick={() => void handleResetPassword()}
        >
          <KeyRound className="size-3.5" />
          Reset Password
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={busy}
          onClick={() => void handleArchive()}
        >
          <Archive className="size-3.5" />
          Archive Member
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-destructive"
          disabled={busy}
          onClick={() => void handleDeactivate()}
        >
          <UserMinus className="size-3.5" />
          Deactivate Member
        </Button>
      </div>
      {message ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {message}
        </p>
      ) : null}

      <EditCrewProfileDialog
        person={person}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <EditCrewProfileDialog
        person={person}
        open={photoOpen}
        onOpenChange={setPhotoOpen}
        focusField="photo"
      />
      <AssignWorkDialog
        person={person}
        open={assignOpen}
        onOpenChange={setAssignOpen}
      />
    </div>
  );
}
