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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createFile } from "@/lib/files/repository";
import type { ProjectOrderStub } from "@/lib/projects/types";

const FILE_TYPES = [
  "Contract",
  "Brief",
  "Raw",
  "Edit",
  "Delivery",
  "Other",
] as const;

interface UploadProjectFileDialogProps {
  projectId: string;
  workspaceId?: string;
  orders: ProjectOrderStub[];
}

export function UploadProjectFileDialog({
  projectId,
  workspaceId,
  orders,
}: UploadProjectFileDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("Other");
  const [size, setSize] = useState("—");
  const [orderId, setOrderId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createFile({
        name: name.trim(),
        type,
        size: size.trim() || "—",
        projectId,
        ...(workspaceId ? { workspaceId } : {}),
        ...(orderId ? { orderId } : {}),
      });
      setOpen(false);
      setName("");
      setSize("—");
      setOrderId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add file");
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
        Add file
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add project file</DialogTitle>
            <DialogDescription>
              Register file metadata on this project (storage upload optional
              later).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="file-name">Name</Label>
              <Input
                id="file-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Client brief.pdf"
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => v && setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="file-size">Size</Label>
                <Input
                  id="file-size"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="2.4 MB"
                />
              </div>
            </div>
            {orders.length > 0 ? (
              <div className="space-y-1.5">
                <Label>Link to order (optional)</Label>
                <Select
                  value={orderId || "__none__"}
                  onValueChange={(v) =>
                    setOrderId(!v || v === "__none__" ? "" : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {orders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Saving…" : "Add file"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
