"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { EditOrderDialog } from "@/components/orders/edit-order-dialog";
import { Button } from "@/components/ui/button";
import { updateSmartOrder } from "@/lib/integration";
import type { Order, SmartOrderInput } from "@/lib/orders/types";

export function OrderEditButton({ order }: { order: Order }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleSave(id: string, patch: Partial<SmartOrderInput>) {
    await updateSmartOrder(id, patch);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Pencil className="size-3.5" />
        Edit
      </Button>
      <EditOrderDialog
        order={order}
        open={open}
        onOpenChange={setOpen}
        onSave={handleSave}
      />
    </>
  );
}
