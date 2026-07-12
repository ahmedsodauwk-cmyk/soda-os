"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HumanExplanation } from "@/components/brand/human-title";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UI_ACTIONS } from "@/lib/brand/ui-actions";
import { getClients } from "@/lib/clients/repository";
import { createQuotation } from "@/lib/quotations";
import type { ClientSegment } from "@/lib/clients/types";

export function NewQuotationForm() {
  const router = useRouter();
  const clients = getClients();
  const [clientId, setClientId] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [segment, setSegment] = useState<ClientSegment>("commercial");
  const [category, setCategory] = useState("");
  const [assignedSales, setAssignedSales] = useState("Junior Soda");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function applyClient(id: string) {
    setClientId(id);
    const client = clients.find((c) => c.id === id);
    if (!client) return;
    setClientName(client.name);
    setCompany(client.company ?? "");
    setContactName(client.contactPerson ?? client.name);
    setContactPhone(client.phone);
    setContactEmail(client.email ?? "");
    setSegment(client.segment);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientName.trim() || !contactName.trim()) {
      setError("Client and contact are required");
      return;
    }
    const created = await createQuotation({
      clientId: clientId || undefined,
      clientName,
      company: company || undefined,
      contactName,
      contactPhone: contactPhone || undefined,
      contactEmail: contactEmail || undefined,
      segment,
      category: category || "General",
      assignedSales,
      notes,
    });
    router.push(`/quotations/${created.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1.5"
        nativeButton={false}
        render={<Link href="/quotations" />}
      >
        <ArrowLeft className="size-4" />
        Quotations
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New quotation</CardTitle>
          <HumanExplanation layer="newQuotation" size="compact" />
          <p className="text-sm text-muted-foreground">
            Starts in New Inquiry. Add line items in the builder.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Link existing client (optional)</Label>
              <Select
                value={clientId || undefined}
                onValueChange={(v) => {
                  if (v) applyClient(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client…" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.segment === "commercial" ? " · Commercial" : " · Wedding"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Client name</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Contact</Label>
                <Input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Segment</Label>
                <Select
                  value={segment}
                  onValueChange={(v) => {
                    if (v) setSegment(v as ClientSegment);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Product campaign"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Assigned sales</Label>
                <Input
                  value={assignedSales}
                  onChange={(e) => setAssignedSales(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : null}

            <Button type="submit">{UI_ACTIONS.createQuotation}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
