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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { assignCrewToOrder } from "@/lib/integration";
import { getPeople, refreshPeople } from "@/lib/people/repository";
import type { Person } from "@/lib/people/types";
import type { ProjectOrderStub } from "@/lib/projects/types";

interface AssignCrewDialogProps {
  orders: ProjectOrderStub[];
  triggerLabel?: string;
}

export function AssignCrewDialog({
  orders,
  triggerLabel = "Assign crew",
}: AssignCrewDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [orderId, setOrderId] = useState(() => orders[0]?.id ?? "");
  const [personId, setPersonId] = useState("");
  const [role, setRole] = useState("Photographer");
  const [employeePrice, setEmployeePrice] = useState("1500");
  const [callTime, setCallTime] = useState("09:00");
  const [meetingPoint, setMeetingPoint] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState("assigned");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void refreshPeople()
      .then(() => {
        if (!cancelled) setPeople(getPeople());
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(employeePrice);
    if (!orderId || !personId || !role.trim() || !Number.isFinite(price) || price < 0) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await assignCrewToOrder({
        orderId,
        personId,
        role: role.trim(),
        employeePrice: price,
        bonus: 0,
        deduction: 0,
        callTime: callTime.trim() || undefined,
        meetingPoint: meetingPoint.trim() || undefined,
        assignmentStatus: assignmentStatus as
          | "assigned"
          | "confirmed"
          | "checked_in"
          | "completed"
          | "no_show"
          | "cancelled",
        notes: notes.trim() || undefined,
      });
      setOpen(false);
      setPersonId("");
      setNotes("");
      setMeetingPoint("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign crew");
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
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign crew</DialogTitle>
            <DialogDescription>
              Assign a crew member to an order on this project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Create an order before assigning crew.
              </p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Order</Label>
                  <Select
                    value={orderId}
                    onValueChange={(v) => v && setOrderId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select order" />
                    </SelectTrigger>
                    <SelectContent>
                      {orders.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.id} · {o.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                          {p.jobTitle ? ` · ${p.jobTitle}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="crew-role">Role</Label>
                    <Input
                      id="crew-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="crew-rate">Expected pay (EGP)</Label>
                    <Input
                      id="crew-rate"
                      type="number"
                      min={0}
                      value={employeePrice}
                      onChange={(e) => setEmployeePrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="crew-call">Call / arrival</Label>
                    <Input
                      id="crew-call"
                      value={callTime}
                      onChange={(e) => setCallTime(e.target.value)}
                      placeholder="09:00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={assignmentStatus}
                      onValueChange={(v) => v && setAssignmentStatus(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="checked_in">Checked in</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="no_show">No show</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crew-meet">Meeting point</Label>
                  <Input
                    id="crew-meet"
                    value={meetingPoint}
                    onChange={(e) => setMeetingPoint(e.target.value)}
                    placeholder="Studio lobby / venue gate"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="crew-notes">Notes</Label>
                  <Textarea
                    id="crew-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={
                saving || orders.length === 0 || !orderId || !personId
              }
            >
              {saving ? "Assigning…" : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
