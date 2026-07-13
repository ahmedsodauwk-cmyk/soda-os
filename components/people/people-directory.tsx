"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FolderOpen, Search, UsersRound } from "lucide-react";

import { PersonAvatar } from "@/components/business/person-avatar";
import { AddCrewMemberDialog } from "@/components/crew/add-crew-member-dialog";
import { PeopleEmptyState } from "@/components/people/people-empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { CrewMember, CrewPerformance } from "@/lib/crew";
import { peopleWorkspaceHref } from "@/lib/people/workspace";

interface PeopleDirectoryProps {
  people: CrewMember[];
  performanceById: Record<string, CrewPerformance>;
  /** Founder / ops with crew.edit — may add a person record (not an Auth account). */
  canEdit?: boolean;
}

/**
 * People OS directory — opens personal workspaces, not a flat ERP table.
 * Honest empty state when Production has no people rows.
 */
export function PeopleDirectory({
  people,
  performanceById,
  canEdit = false,
}: PeopleDirectoryProps) {
  const [search, setSearch] = useState("");
  const [localPeople, setLocalPeople] = useState(people);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return localPeople;
    return localPeople.filter(
      (p) =>
        p.nameEn.toLowerCase().includes(q) ||
        p.nameAr.includes(search.trim()) ||
        (p.nickname?.includes(search.trim()) ?? false) ||
        (p.displayName?.toLowerCase().includes(q) ?? false) ||
        p.jobTitle.toLowerCase().includes(q) ||
        (p.department?.toLowerCase().includes(q) ?? false)
    );
  }, [localPeople, search]);

  if (localPeople.length === 0) {
    return (
      <div className="space-y-6">
        <DirectoryIntro
          canEdit={canEdit}
          onCreated={(person) =>
            setLocalPeople((prev) => {
              if (prev.some((p) => p.id === person.id)) return prev;
              return [...prev, person];
            })
          }
        />
        <PeopleEmptyState
          title="No people in SODA VISUALS yet"
          detail="People OS stays empty until the Founder records real studio members. No demo users, placeholder names, or invented crew."
          hint="Auth accounts are separate — they wait for the official crew list. This directory will open each member’s operational workspace when people exist."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DirectoryIntro
        canEdit={canEdit}
        onCreated={(person) =>
          setLocalPeople((prev) => {
            if (prev.some((p) => p.id === person.id)) return prev;
            return [...prev, person];
          })
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search People OS…"
            className="pl-9"
          />
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((person) => {
          const perf = performanceById[person.id];
          const label =
            person.displayName?.trim() ||
            person.nickname?.trim() ||
            person.nameEn;
          return (
            <li key={person.id}>
              <Link
                href={peopleWorkspaceHref(person.id)}
                className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/40 to-primary/[0.05] p-4 transition-colors hover:border-primary/35"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-10 -right-8 size-28 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100"
                />
                <div className="relative flex items-start gap-3">
                  <PersonAvatar
                    nameAr={person.nameAr}
                    nameEn={person.nameEn}
                    initials={person.initials}
                    avatarUrl={person.avatarUrl}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-heading text-base font-semibold">
                      {label}
                    </p>
                    {person.nameAr ? (
                      <p
                        className="truncate font-ar text-sm text-muted-foreground"
                        dir="rtl"
                      >
                        {person.nameAr}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {person.jobTitle ? (
                        <Badge variant="outline">{person.jobTitle}</Badge>
                      ) : null}
                      {person.department ? (
                        <Badge variant="secondary">{person.department}</Badge>
                      ) : null}
                    </div>
                  </div>
                  <FolderOpen className="size-4 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-primary" />
                </div>
                <div className="relative mt-auto flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="capitalize">
                    {person.status.replace("_", " ")}
                  </span>
                  {perf ? (
                    <span>Load {perf.currentWorkload}</span>
                  ) : (
                    <span>Open workspace →</span>
                  )}
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

function DirectoryIntro({
  canEdit,
  onCreated,
}: {
  canEdit: boolean;
  onCreated: (person: CrewMember) => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-xl space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <UsersRound className="size-4" />
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase">
            People OS
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Every person opens a personal operational workspace — orders, wallet,
          attendance, performance, files — not a flat admin table.
        </p>
      </div>
      {canEdit ? (
        <AddCrewMemberDialog
          onCreated={(person) => {
            onCreated(person);
          }}
        />
      ) : null}
    </div>
  );
}
