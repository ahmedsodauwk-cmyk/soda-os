import type {
  CrewResponsibility,
  EmploymentType,
  Person,
  PersonStatus,
} from "@/lib/people/types";

/** Row shape for `public.people` (snake_case). */
export type PersonRow = {
  id: string;
  name_ar: string;
  name_en: string;
  nickname: string | null;
  display_name: string | null;
  job_title: string;
  job_description: string;
  department: string | null;
  employment_type: string | null;
  responsibilities: unknown;
  not_responsible_for: unknown;
  phone: string;
  email: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  join_date: string | null;
  status: string;
  avatar_url: string | null;
  notes?: string | null;
  initials: string;
  created_at: string;
  updated_at?: string;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v));
}

export function rowToPerson(row: PersonRow): Person {
  const responsibilities = asStringArray(row.responsibilities) as CrewResponsibility[];
  const notResponsibleFor = asStringArray(
    row.not_responsible_for
  ) as CrewResponsibility[];

  return {
    id: row.id,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    ...(row.nickname ? { nickname: row.nickname } : {}),
    ...(row.display_name ? { displayName: row.display_name } : {}),
    jobTitle: row.job_title,
    jobDescription: row.job_description ?? "",
    ...(row.department ? { department: row.department } : {}),
    ...(row.employment_type
      ? { employmentType: row.employment_type as EmploymentType }
      : {}),
    ...(responsibilities.length > 0 ? { responsibilities } : {}),
    ...(notResponsibleFor.length > 0
      ? { notResponsibleFor }
      : {}),
    phone: row.phone ?? "",
    email: row.email ?? "",
    ...(row.emergency_contact_name
      ? { emergencyContactName: row.emergency_contact_name }
      : {}),
    ...(row.emergency_contact_phone
      ? { emergencyContactPhone: row.emergency_contact_phone }
      : {}),
    joinDate: row.join_date ?? "",
    status: row.status as PersonStatus,
    ...(row.avatar_url ? { avatarUrl: row.avatar_url } : {}),
    ...(row.notes != null && String(row.notes).trim()
      ? { notes: String(row.notes) }
      : {}),
    initials: row.initials ?? "",
    createdAt: row.created_at,
    ...(row.updated_at ? { updatedAt: row.updated_at } : {}),
  };
}

export function personToRow(
  person: Omit<Person, "createdAt"> & { createdAt?: string }
): Record<string, unknown> {
  return {
    id: person.id,
    name_ar: person.nameAr,
    name_en: person.nameEn,
    nickname: person.nickname ?? null,
    display_name: person.displayName ?? null,
    job_title: person.jobTitle,
    job_description: person.jobDescription ?? "",
    department: person.department ?? null,
    employment_type: person.employmentType ?? null,
    responsibilities: person.responsibilities ?? [],
    not_responsible_for: person.notResponsibleFor ?? [],
    phone: person.phone ?? "",
    email: person.email ?? "",
    emergency_contact_name: person.emergencyContactName ?? null,
    emergency_contact_phone: person.emergencyContactPhone ?? null,
    join_date: person.joinDate || null,
    status: person.status,
    avatar_url: person.avatarUrl ?? null,
    notes: person.notes ?? null,
    initials: person.initials,
    ...(person.createdAt ? { created_at: person.createdAt } : {}),
  };
}
