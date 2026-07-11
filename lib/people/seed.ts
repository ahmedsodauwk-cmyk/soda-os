import type { Person } from "@/lib/people/types";

/**
 * Legacy empty array — do not use as source of truth.
 * People live in Supabase `public.people` via `lib/people/repository`.
 */
export const mockPeople: Person[] = [];
