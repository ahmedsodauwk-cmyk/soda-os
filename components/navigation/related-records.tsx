import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type RelatedLink = {
  label: string;
  href: string;
  detail?: string;
};

interface RelatedRecordsProps {
  title?: string;
  items: RelatedLink[];
}

export function RelatedRecords({
  title = "Related",
  items,
}: RelatedRecordsProps) {
  if (items.length === 0) return null;

  return (
    <Card className="soda-cc-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>Jump to connected records</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((item) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className="flex items-center justify-between rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted/60"
          >
            <span className="font-medium">{item.label}</span>
            {item.detail ? (
              <span className="text-xs text-muted-foreground">{item.detail}</span>
            ) : null}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
