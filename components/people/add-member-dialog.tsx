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
import { createPerson } from "@/lib/people/repository";
import type { Person } from "@/lib/people/types";

interface AddMemberDialogProps {
  onCreated: (person: Person) => void;
}

export function AddMemberDialog({ onCreated }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  function reset() {
    setNameAr("");
    setNameEn("");
    setJobTitle("");
    setJobDescription("");
    setPhone("");
    setEmail("");
    setAvatarUrl("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameAr.trim() || !nameEn.trim() || !jobTitle.trim() || !phone.trim()) {
      return;
    }
    const person = await createPerson({
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      jobTitle: jobTitle.trim(),
      jobDescription: jobDescription.trim() || jobTitle.trim(),
      phone: phone.trim(),
      email: email.trim() || `${nameEn.trim().toLowerCase().replace(/\s+/g, ".")}@sodavisuals.com`,
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
        Add member
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
            <DialogDescription>
              Create a person profile. Payments come from order assignments — never
              enter a salary here.
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
              <Label htmlFor="jobTitle">Job title / role</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                required
              />
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
              <Label htmlFor="avatarUrl">Picture URL (local / mock)</Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="/avatars/…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Create person</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
