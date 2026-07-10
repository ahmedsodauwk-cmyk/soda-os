import Link from "next/link";
import { Wallet } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PersonAvatar } from "@/components/business/person-avatar";
import { HUMAN_LAYER } from "@/lib/brand";
import { getPeopleOwedSummary } from "@/lib/people/repository";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

/** Real amounts owed to people from order assignments. */
export default function PeopleOwedCard() {
  const rows = getPeopleOwedSummary().slice(0, 5);

  if (rows.length === 0) return null;

  return (
    <Card className="soda-cc-card h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="size-4 text-soda-pink" />
          Owed to The Crew
        </CardTitle>
        <CardDescription
          className="font-ar text-[0.9375rem] leading-[1.8] text-muted-foreground"
          dir="rtl"
        >
          {HUMAN_LAYER.owedToCrew}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map(({ person, outstanding }) => (
          <Link
            key={person.id}
            href={`/crew/${person.id}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5 hover:border-soda-pink/35"
          >
            <PersonAvatar
              nameAr={person.nameAr}
              nameEn={person.nameEn}
              initials={person.initials}
              avatarUrl={person.avatarUrl}
              showNames
              size="sm"
            />
            <p className="shrink-0 font-mono text-xs font-medium text-soda-pink">
              {egp(outstanding)}
            </p>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
