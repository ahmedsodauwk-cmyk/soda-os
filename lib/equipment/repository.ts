import type {
  EquipmentAssignment,
  EquipmentItem,
} from "@/lib/equipment/types";
import {
  mockEquipment,
  mockEquipmentAssignments,
} from "@/lib/equipment/seed";

/** Source of truth is seed arrays — no separate copy that can retain stale demo rows. */
export function getEquipment(): EquipmentItem[] {
  return [...mockEquipment];
}

export function getEquipmentById(id: string): EquipmentItem | undefined {
  return mockEquipment.find((e) => e.id === id);
}

export function getAvailableEquipment(): EquipmentItem[] {
  return mockEquipment.filter((e) => e.status === "available");
}

export function getEquipmentAssignments(): EquipmentAssignment[] {
  return [...mockEquipmentAssignments];
}

export function getActiveEquipmentForPerson(
  personId: string
): Array<EquipmentItem & { assignment: EquipmentAssignment }> {
  return mockEquipmentAssignments
    .filter((a) => a.personId === personId && !a.returnedAt)
    .map((assignment) => {
      const item = mockEquipment.find((e) => e.id === assignment.equipmentId);
      if (!item) return null;
      return { ...item, assignment };
    })
    .filter((x): x is EquipmentItem & { assignment: EquipmentAssignment } =>
      Boolean(x)
    );
}

export function getEquipmentHistoryForPerson(
  personId: string
): Array<EquipmentItem & { assignment: EquipmentAssignment }> {
  return mockEquipmentAssignments
    .filter((a) => a.personId === personId)
    .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))
    .map((assignment) => {
      const item = mockEquipment.find((e) => e.id === assignment.equipmentId);
      if (!item) return null;
      return { ...item, assignment };
    })
    .filter((x): x is EquipmentItem & { assignment: EquipmentAssignment } =>
      Boolean(x)
    );
}

export function getAssignmentHistoryForEquipment(
  equipmentId: string
): Array<EquipmentAssignment & { personId: string }> {
  return mockEquipmentAssignments
    .filter((a) => a.equipmentId === equipmentId)
    .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt));
}

/** Assign available equipment to a crew member (in-memory). */
export function assignEquipmentToPerson(
  equipmentId: string,
  personId: string,
  note?: string
): EquipmentAssignment | null {
  const item = mockEquipment.find((e) => e.id === equipmentId);
  if (!item || item.status !== "available") return null;

  const assignment: EquipmentAssignment = {
    id: `eqa-${Date.now().toString(36)}`,
    equipmentId,
    personId,
    assignedAt: new Date().toISOString().slice(0, 10),
    note,
  };
  mockEquipmentAssignments.push(assignment);
  item.status = "assigned";
  return assignment;
}
