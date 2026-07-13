"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UI_ACTIONS } from "@/lib/brand/ui-actions";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  PERSON_STATUSES,
  type EmploymentType,
  type Person,
  type PersonStatus,
} from "@/lib/people/types";
import {
  fetchLinkedRoleForPerson,
  updateCrewProfileAction,
  updateLinkedRoleAction,
} from "@/lib/people/actions";
import { INVITEABLE_ROLES, ROLE_LABELS, type SodaRole } from "@/lib/identity/roles";

interface EditCrewProfileDialogProps {
  person: Person;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Focus a specific field when opened from an interactive card */
  focusField?:
    | "phone"
    | "email"
    | "department"
    | "photo"
    | "role"
    | "notes"
    | null;
}

export function EditCrewProfileDialog({
  person,
  open,
  onOpenChange,
  focusField = null,
}: EditCrewProfileDialogProps) {
  const router = useRouter();
  const [nameEn, setNameEn] = useState(person.nameEn);
  const [nameAr, setNameAr] = useState(person.nameAr);
  const [displayName, setDisplayName] = useState(
    person.displayName ?? person.nickname ?? ""
  );
  const [jobTitle, setJobTitle] = useState(person.jobTitle);
  const [department, setDepartment] = useState(person.department ?? "");
  const [phone, setPhone] = useState(person.phone);
  const [email, setEmail] = useState(person.email);
  const [status, setStatus] = useState<PersonStatus>(person.status);
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    person.employmentType ?? "full_time"
  );
  const [emergencyName, setEmergencyName] = useState(
    person.emergencyContactName ?? ""
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    person.emergencyContactPhone ?? ""
  );
  const [notes, setNotes] = useState(person.notes ?? "");
  const [avatarUrl, setAvatarUrl] = useState(person.avatarUrl ?? "");
  const [linkedRole, setLinkedRole] = useState<SodaRole | "">("");
  const [hasProfile, setHasProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNameEn(person.nameEn);
    setNameAr(person.nameAr);
    setDisplayName(person.displayName ?? person.nickname ?? "");
    setJobTitle(person.jobTitle);
    setDepartment(person.department ?? "");
    setPhone(person.phone);
    setEmail(person.email);
    setStatus(person.status);
    setEmploymentType(person.employmentType ?? "full_time");
    setEmergencyName(person.emergencyContactName ?? "");
    setEmergencyPhone(person.emergencyContactPhone ?? "");
    setNotes(person.notes ?? "");
    setAvatarUrl(person.avatarUrl ?? "");
    setError(null);

    let cancelled = false;
    void fetchLinkedRoleForPerson(person.id).then((link) => {
      if (cancelled) return;
      setHasProfile(Boolean(link.profileId));
      setLinkedRole(link.role ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [open, person]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const result = await updateCrewProfileAction(person.id, {
        nameEn: nameEn.trim(),
        nameAr: nameAr.trim(),
        displayName: displayName.trim() || undefined,
        nickname: displayName.trim() || person.nickname,
        jobTitle: jobTitle.trim(),
        jobDescription: person.jobDescription || jobTitle.trim(),
        department: department.trim() || undefined,
        phone: phone.trim(),
        email: email.trim(),
        status,
        employmentType,
        emergencyContactName: emergencyName.trim() || undefined,
        emergencyContactPhone: emergencyPhone.trim() || undefined,
        notes: notes.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error ?? "Save failed.");
        return;
      }

      if (hasProfile && linkedRole) {
        const roleResult = await updateLinkedRoleAction(person.id, linkedRole);
        if (!roleResult.ok) {
          setError(roleResult.error ?? "Profile saved, but role update failed.");
          return;
        }
      }

      onOpenChange(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={(e) => void handleSave(e)}>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update this crew member’s operational record. Nothing is invented —
              empty fields stay empty until you record them.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
              <div className="grid gap-1.5">
                <Label>Full Name (EN)</Label>
                <Input
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                  autoFocus={focusField == null}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Full Name (AR)</Label>
                <Input
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  dir="rtl"
                  className="font-ar"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Display Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
              <div className="grid gap-1.5">
                <Label>Position</Label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Department</Label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  autoFocus={focusField === "department"}
                />
              </div>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
              <div className="grid gap-1.5">
                <Label>Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus={focusField === "phone"}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus={focusField === "email"}
                />
              </div>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
              <div className="grid gap-1.5">
                <Label>Employment Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PersonStatus)}
                  className="border-input bg-background h-8 rounded-lg border px-2 text-sm"
                >
                  {PERSON_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Employment Type</Label>
                <select
                  value={employmentType}
                  onChange={(e) =>
                    setEmploymentType(e.target.value as EmploymentType)
                  }
                  className="border-input bg-background h-8 rounded-lg border px-2 text-sm"
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {EMPLOYMENT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
              <div className="grid gap-1.5">
                <Label>Emergency Contact</Label>
                <Input
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="Name"
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Emergency Phone</Label>
                <Input
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="Phone"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Role (Auth)</Label>
              {hasProfile ? (
                <select
                  value={linkedRole}
                  onChange={(e) => setLinkedRole(e.target.value as SodaRole)}
                  className="border-input bg-background h-8 rounded-lg border px-2 text-sm"
                  autoFocus={focusField === "role" ? true : undefined}
                >
                  <option value="">Select role…</option>
                  {INVITEABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No linked Auth account yet — Role waits until the Founder
                  provisions login for this crew member.
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label>Profile Photo URL / path</Label>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://… or storage path"
                autoFocus={focusField === "photo"}
              />
              <p className="text-[11px] text-muted-foreground">
                Saves the URL/path only — upload infrastructure stays as-is; no
                invented images.
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                autoFocus={focusField === "notes"}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? UI_ACTIONS.saving : UI_ACTIONS.saveChanges}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
