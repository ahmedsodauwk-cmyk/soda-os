import Link from "next/link";

import { SodaSectionHeader } from "@/components/brand/soda-section-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { isPersonalBrainUiEnabled } from "@/lib/personal-brain/feature-flag";
import { listPersonalBrainEntries } from "@/lib/personal-brain/repository";

/** Personal Brain surface — hidden until Founder approves migration 20260728000033. */
export async function PersonalBrainGate() {
  if (!isPersonalBrainUiEnabled()) {
    return (
      <Card className="soda-cc-card max-w-2xl">
        <CardHeader>
          <SodaSectionHeader
            title="Personal Brain"
            layer="brain"
            as="h1"
            size="page"
          />
        </CardHeader>
        <CardContent className="space-y-4 text-[15px] text-muted-foreground">
          <p>
            Personal Brain is scaffolded in source but{" "}
            <strong className="font-semibold text-foreground">
              not enabled on Production
            </strong>
            . Founder migration approval is required before applying{" "}
            <code className="text-sm">20260728000033</code>.
          </p>
          <p>
            Owner-only RLS — isolated from SODA Brain (Founder) data. No cross-user
            reads.
          </p>
          <Button variant="outline" nativeButton={false} render={<Link href="/me" />}>
            Back to My Workspace
          </Button>
        </CardContent>
      </Card>
    );
  }

  const entries = await listPersonalBrainEntries();

  return (
    <Card className="soda-cc-card max-w-3xl">
      <CardHeader>
        <SodaSectionHeader
          title="Personal Brain"
          layer="brain"
          as="h1"
          size="page"
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 ? (
          <p className="rounded-lg border border-border/50 bg-muted/20 px-4 py-6 text-center text-muted-foreground">
            Your private brain is empty. Notes you add here are visible only to you.
          </p>
        ) : (
          <ul className="divide-y divide-border/40">
            {entries.map((entry) => (
              <li key={entry.id} className="py-3">
                <p className="font-semibold">{entry.title ?? "Untitled"}</p>
                <p className="text-sm text-muted-foreground">{entry.body}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
