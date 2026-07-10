"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { PersonAvatar } from "@/components/business/person-avatar";
import { AddCrewMemberDialog } from "@/components/crew/add-crew-member-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { CrewMember, CrewPerformance } from "@/lib/crew";

function egp(n: number) {
  return `${n.toLocaleString("en-EG")} EGP`;
}

interface CrewListProps {
  crew: CrewMember[];
  performanceById: Record<string, CrewPerformance>;
}

export function CrewList({ crew, performanceById }: CrewListProps) {
  const [search, setSearch] = useState("");
  const [localCrew, setLocalCrew] = useState(crew);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return localCrew;
    return localCrew.filter(
      (p) =>
        p.nameEn.toLowerCase().includes(q) ||
        p.nameAr.includes(search.trim()) ||
        (p.nickname?.includes(search.trim()) ?? false) ||
        p.jobTitle.toLowerCase().includes(q)
    );
  }, [localCrew, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search The Crew…"
            className="pl-9"
          />
        </div>
        <AddCrewMemberDialog
          onCreated={(person) => setLocalCrew((prev) => [...prev, person])}
        />
      </div>

      <ul className="space-y-2">
        {filtered.map((person) => {
          const perf = performanceById[person.id];
          return (
            <li key={person.id}>
              <Link
                href={`/crew/${person.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 px-3.5 py-3 hover:border-soda-pink/35"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <PersonAvatar
                    nameAr={person.nameAr}
                    nameEn={person.nameEn}
                    initials={person.initials}
                    avatarUrl={person.avatarUrl}
                    showNames
                  />
                  {person.nickname ? (
                    <span
                      className="font-ar text-xs text-muted-foreground"
                      dir="rtl"
                    >
                      {person.nickname}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline">{person.jobTitle}</Badge>
                  {person.employmentType ? (
                    <Badge variant="secondary" className="capitalize">
                      {person.employmentType.replace("_", " ")}
                    </Badge>
                  ) : null}
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
        <p className="text-sm text-muted-foreground">
          {localCrew.length === 0
            ? "No crew members yet."
            : "No crew members match."}
        </p>
      ) : null}
    </div>
  );
}
