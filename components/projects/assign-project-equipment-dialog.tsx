"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  assignEquipmentToPerson,
  getAvailableEquipment,
  refreshEquipment,
} from "@/lib/equipment/repository";
import type { EquipmentItem } from "@/lib/equipment/types";
import { getPeople, refreshPeople } from "@/lib/people/repository";
import type { Person } from "@/lib/people/types";

export function AssignProjectEquipmentDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [available, setAvailable] = useState<EquipmentItem[]>([]);
  const [personId, setPersonId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void Promise.all([refreshPeople(), refreshEquipment()])
      .then(() => {
        if (cancelled) return;
        setPeople(getPeople());
        setAvailable(getAvailableEquipment());
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!personId || !equipmentId) return;
    setSaving(true);
    try {
      const result = await assignEquipmentToPerson(equipmentId, personId);
      if (result) {
        setOpen(false);
        setPersonId("");
        setEquipmentId("");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5" />
        }
      >
        <Plus className="size-3.5" />
        Assign equipment
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign equipment</DialogTitle>
            <DialogDescription>
              Check out available kit to a crew member for this job.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="space-y-1.5">
              <Label>Crew member</Label>
              <Select
                value={personId}
                onValueChange={(v) => v && setPersonId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {people.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Available equipment</Label>
              {available.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No available equipment.
                </p>
              ) : (
                <Select
                  value={equipmentId}
                  onValueChange={(v) => v && setEquipmentId(v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name}
                        {eq.serialNumber ? ` (${eq.serialNumber})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={saving || !personId || !equipmentId}
            >
              {saving ? "Assigning…" : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
