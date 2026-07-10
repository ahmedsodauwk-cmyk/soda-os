import type {
  EquipmentAssignment,
  EquipmentItem,
} from "@/lib/equipment/types";
import {
  mockEquipment,
  mockEquipmentAssignments,
} from "@/lib/equipment/seed";

export function getEquipment(): EquipmentItem[] {
  return [...mockEquipment];
}

export function getEquipmentById(id: string): EquipmentItem | undefined {
  return mockEquipment.find((e) => e.id === id);
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
