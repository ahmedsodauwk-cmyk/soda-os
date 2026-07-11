import type { Project } from "@/lib/projects/types";

/**
 * Legacy empty array — do not use as source of truth.
 * Projects live in Supabase via `lib/projects/repository`.
 */
export const mockProjects: Project[] = [];
