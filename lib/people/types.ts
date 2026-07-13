/**
 * People / Crew OS — studio members.
 * Product name: The Crew. Payments NEVER manual — from order assignments.
 */

export const PERSON_STATUSES = ["active", "inactive", "on_leave"] as const;
export type PersonStatus = (typeof PERSON_STATUSES)[number];

export const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "freelance",
  "contractor",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  freelance: "Freelance",
  contractor: "Contractor",
};

/** What a crew member IS / is NOT responsible for */
export const CREW_RESPONSIBILITIES = [
  "Photography",
  "Videography",
  "Editing",
  "Color Grading",
  "Retouching",
  "Drone",
  "Lighting",
  "Creative Direction",
  "Assistant",
  "Production",
  "Client Relations",
] as const;
export type CrewResponsibility = (typeof CREW_RESPONSIBILITIES)[number];

export interface Person {
  id: string;
  /** Arabic display name / legal Arabic name */
  nameAr: string;
  /** English legal / payroll name (Full Name) */
  nameEn: string;
  /** Studio nickname (e.g. نيمو) */
  nickname?: string;
  /** Studio-facing display name (may differ from legal name) */
  displayName?: string;
  /** Position / job title */
  jobTitle: string;
  jobDescription: string;
  /** Department / desk */
  department?: string;
  employmentType?: EmploymentType;
  /** Skills / crafts they ARE responsible for */
  responsibilities?: CrewResponsibility[];
  /** Explicitly NOT responsible for */
  notResponsibleFor?: CrewResponsibility[];
  phone: string;
  email: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  joinDate: string;
  /** Employment status */
  status: PersonStatus;
  /** Profile photo URL */
  avatarUrl?: string;
  /** Internal Founder notes — empty until recorded */
  notes?: string;
  initials: string;
  createdAt: string;
  /** Last row update when available from DB */
  updatedAt?: string;
}

export type NewPersonInput = Omit<Person, "id" | "createdAt" | "initials"> & {
  initials?: string;
};

export interface PersonPerformance {
  personId: string;
  projectsCompleted: number;
  ordersCompleted: number;
  currentWorkload: number;
  /** Average days from shoot → delivery on completed assignments */
  avgDeliverySpeedDays: number | null;
  lateDeliveries: number;
  clientRating: number | null;
  /** Sum of final amounts owed (paid + remaining) */
  totalEarned: number;
  totalPaid: number;
  totalOutstanding: number;
  /** Data-backed flags only */
  achievements: string[];
  warnings: string[];
}

export interface PersonPaymentLine {
  assignmentId: string;
  orderId: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  workspaceId: string;
  role: string;
  employeePrice: number;
  bonus: number;
  deduction: number;
  finalAmount: number;
  paidAmount: number;
  remaining: number;
  paid: boolean;
  shootDate: string;
}

export interface PersonPaymentSummary {
  personId: string;
  lines: PersonPaymentLine[];
  monthly: Array<{ month: string; earned: number; paid: number; remaining: number }>;
  yearly: Array<{ year: string; earned: number; paid: number; remaining: number }>;
  totalEarned: number;
  totalPaid: number;
  totalOutstanding: number;
  previousBalance: number;
  currentBalance: number;
}
