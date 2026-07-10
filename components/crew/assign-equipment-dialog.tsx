"use client";

import { useState } from "react";
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
  assignEquipmentToPerson,
  getAvailableEquipment,
} from "@/lib/equipment/repository";

interface AssignEquipmentDialogProps {
  personId: string;
}

export function AssignEquipmentDialog({ personId }: AssignEquipmentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [equipmentId, setEquipmentId] = useState("");
  const available = getAvailableEquipment();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!equipmentId) return;
    const result = assignEquipmentToPerson(equipmentId, personId);
    if (result) {
      setOpen(false);
      setEquipmentId("");
      router.refresh();
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
              Assign available kit to this crew member.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="equipment">Available equipment</Label>
              {available.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No available equipment.
                </p>
              ) : (
                <select
                  id="equipment"
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                  className="border-input bg-background h-9 rounded-lg border px-2 text-sm"
                  required
                >
                  <option value="">Select…</option>
                  {available.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name}
                      {eq.serialNumber ? ` (${eq.serialNumber})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!equipmentId}>
              Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
