import Link from "next/link";

import { SodaLogo } from "@/components/brand/soda-logo";

interface RelationshipEmptyStateProps {
  title: string;
  question: string;
  detail: string;
  href?: string;
  hrefLabel?: string;
}

/**
 * Honest empty surface for Reference Client Engine sections.
 * Relationship workspace voice — not a CRM “add record” form.
 */
export function RelationshipEmptyState({
  title,
  question,
  detail,
  href,
  hrefLabel,
}: RelationshipEmptyStateProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/60 px-4 py-6">
      <SodaLogo placement="empty" showWord={false} />
      <h3 className="font-heading text-base font-semibold">{title}</h3>
      <p className="text-sm font-medium text-foreground/90">{question}</p>
      <p className="text-sm text-muted-foreground">{detail}</p>
      {href && hrefLabel ? (
        <Link
          href={href}
          className="inline-block text-sm text-soda-pink hover:underline"
        >
          {hrefLabel}
        </Link>
      ) : null}
    </div>
  );
}
