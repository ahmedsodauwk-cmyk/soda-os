"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

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
import {
  CREW_RESPONSIBILITIES,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  deleteCrewMember,
  updateCrewMember,
  type CrewMember,
  type CrewResponsibility,
  type EmploymentType,
  type PersonStatus,
} from "@/lib/crew";

interface CrewMemberActionsProps {
  person: CrewMember;
  onUpdated?: (person: CrewMember) => void;
  onDeleted?: (id: string) => void;
}

export function CrewMemberActions({
  person,
  onUpdated,
  onDeleted,
}: CrewMemberActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nameAr, setNameAr] = useState(person.nameAr);
  const [nameEn, setNameEn] = useState(person.nameEn);
  const [nickname, setNickname] = useState(person.nickname ?? "");
  const [jobTitle, setJobTitle] = useState(person.jobTitle);
  const [jobDescription, setJobDescription] = useState(person.jobDescription);
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    person.employmentType ?? "full_time"
  );
  const [responsibilities, setResponsibilities] = useState<
    CrewResponsibility[]
  >(person.responsibilities ?? []);
  const [phone, setPhone] = useState(person.phone);
  const [email, setEmail] = useState(person.email);
  const [status, setStatus] = useState<PersonStatus>(person.status);
  const [saving, setSaving] = useState(false);

  function toggleResponsibility(r: CrewResponsibility) {
    setResponsibilities((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateCrewMember(person.id, {
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        nickname: nickname.trim() || undefined,
        jobTitle: jobTitle.trim(),
        jobDescription: jobDescription.trim() || jobTitle.trim(),
        employmentType,
        responsibilities,
        phone: phone.trim(),
        email: email.trim(),
        status,
      });
      onUpdated?.(updated);
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete crew member “${person.nameEn}”?`)) return;
    await deleteCrewMember(person.id);
    onDeleted?.(person.id);
    router.refresh();
    router.push("/crew");
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => setOpen(true)}
        >
          <Pencil className="size-3.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-destructive"
          onClick={() => void handleDelete()}
        >
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>Edit Crew Member</DialogTitle>
              <DialogDescription>Update profile details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <div className="grid gap-1.5">
                <Label>Arabic name</Label>
                <Input
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  dir="rtl"
                  className="font-ar"
                  required
                />
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
                <div className="grid gap-1.5">
                  <Label>English name</Label>
                  <Input
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Nickname</Label>
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    dir="rtl"
                    className="font-ar"
                  />
                </div>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
                <div className="grid gap-1.5">
                  <Label>Job title</Label>
                  <Input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Employment</Label>
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
              <div className="grid gap-1.5">
                <Label>Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PersonStatus)}
                  className="border-input bg-background h-8 rounded-lg border px-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On leave</option>
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label>Job description</Label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Responsibilities</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CREW_RESPONSIBILITIES.map((r) => {
                    const active = responsibilities.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleResponsibility(r)}
                        className={
                          active
                            ? "rounded-md border border-soda-pink/50 bg-soda-pink/15 px-2 py-1 text-xs text-soda-pink"
                            : "rounded-md border border-border/60 px-2 py-1 text-xs text-muted-foreground"
                        }
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
                <div className="grid gap-1.5">
                  <Label>Phone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
