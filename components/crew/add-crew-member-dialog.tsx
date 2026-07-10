"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  CREW_RESPONSIBILITIES,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  createCrewMember,
  type CrewMember,
  type CrewResponsibility,
  type EmploymentType,
} from "@/lib/crew";

interface AddCrewMemberDialogProps {
  onCreated: (person: CrewMember) => void;
}

export function AddCrewMemberDialog({ onCreated }: AddCrewMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nickname, setNickname] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [employmentType, setEmploymentType] =
    useState<EmploymentType>("full_time");
  const [responsibilities, setResponsibilities] = useState<
    CrewResponsibility[]
  >([]);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  function reset() {
    setNameAr("");
    setNameEn("");
    setNickname("");
    setJobTitle("");
    setJobDescription("");
    setEmploymentType("full_time");
    setResponsibilities([]);
    setPhone("");
    setEmail("");
    setAvatarUrl("");
  }

  function toggleResponsibility(r: CrewResponsibility) {
    setResponsibilities((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameAr.trim() || !nameEn.trim() || !jobTitle.trim() || !phone.trim()) {
      return;
    }
    const person = createCrewMember({
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      nickname: nickname.trim() || undefined,
      jobTitle: jobTitle.trim(),
      jobDescription: jobDescription.trim() || jobTitle.trim(),
      employmentType,
      responsibilities,
      phone: phone.trim(),
      email:
        email.trim() ||
        `${nameEn.trim().toLowerCase().replace(/\s+/g, ".")}@sodavisuals.com`,
      joinDate: new Date().toISOString().slice(0, 10),
      status: "active",
      avatarUrl: avatarUrl.trim() || undefined,
    });
    onCreated(person);
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-1.5 bg-soda-action text-soda-action-foreground hover:bg-soda-action/90" />
        }
      >
        <Plus className="size-4" />
        Add Crew Member
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Crew Member</DialogTitle>
            <DialogDescription>
              Payments come from order assignments only — never enter a salary.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="nameAr">Arabic name</Label>
              <Input
                id="nameAr"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                dir="rtl"
                className="font-ar"
                required
              />
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="nameEn">English name</Label>
                <Input
                  id="nameEn"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="nickname">Nickname</Label>
                <Input
                  id="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  dir="rtl"
                  className="font-ar"
                />
              </div>
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="jobTitle">Job title</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="employmentType">Employment type</Label>
                <select
                  id="employmentType"
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
              <Label htmlFor="jobDescription">Job description</Label>
              <Textarea
                id="jobDescription"
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
                          : "rounded-md border border-border/60 px-2 py-1 text-xs text-muted-foreground hover:border-soda-pink/30"
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
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="avatarUrl">Photo URL</Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="/avatars/…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create crew member</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
