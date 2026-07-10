/**
 * People OS — studio members (replaces informal “Team” label).
 * Payments are NEVER manual salary — always derived from order assignments.
 */

export const PERSON_STATUSES = ["active", "inactive", "on_leave"] as const;
export type PersonStatus = (typeof PERSON_STATUSES)[number];

export interface Person {
  id: string;
  /** Arabic display name */
  nameAr: string;
  /** English legal / payroll name */
  nameEn: string;
  jobTitle: string;
  jobDescription: string;
  phone: string;
  email: string;
  joinDate: string;
  status: PersonStatus;
  /** Local / mock avatar URL */
  avatarUrl?: string;
  initials: string;
  createdAt: string;
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
