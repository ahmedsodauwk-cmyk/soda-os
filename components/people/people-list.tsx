"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { PersonAvatar } from "@/components/business/person-avatar";
import { AddMemberDialog } from "@/components/people/add-member-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Person, PersonPerformance } from "@/lib/people/types";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

interface PeopleListProps {
  people: Person[];
  performanceById: Record<string, PersonPerformance>;
}

export function PeopleList({ people, performanceById }: PeopleListProps) {
  const [search, setSearch] = useState("");
  const [localPeople, setLocalPeople] = useState(people);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return localPeople;
    return localPeople.filter(
      (p) =>
        p.nameEn.toLowerCase().includes(q) ||
        p.nameAr.includes(search.trim()) ||
        p.jobTitle.toLowerCase().includes(q)
    );
  }, [localPeople, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people…"
            className="pl-9"
          />
        </div>
        <AddMemberDialog
          onCreated={(person) => setLocalPeople((prev) => [...prev, person])}
        />
      </div>

      <ul className="space-y-2">
        {filtered.map((person) => {
          const perf = performanceById[person.id];
          return (
            <li key={person.id}>
              <Link
                href={`/people/${person.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 px-3.5 py-3 hover:border-soda-pink/35"
              >
                <PersonAvatar
                  nameAr={person.nameAr}
                  nameEn={person.nameEn}
                  initials={person.initials}
                  avatarUrl={person.avatarUrl}
                  showNames
                />
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline">{person.jobTitle}</Badge>
                  {perf ? (
                    <>
                      <span className="text-muted-foreground">
                        Load {perf.currentWorkload}
                      </span>
                      {perf.totalOutstanding > 0 ? (
                        <span className="font-mono text-soda-pink">
                          {egp(perf.totalOutstanding)} owed
                        </span>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No people match.</p>
      ) : null}
    </div>
  );
}
