import type {
  EquipmentAssignment,
  EquipmentItem,
} from "@/lib/equipment/types";
import {
  mockEquipment,
  mockEquipmentAssignments,
} from "@/lib/equipment/seed";

let equipmentStore: EquipmentItem[] = [...mockEquipment];
let assignmentStore: EquipmentAssignment[] = [...mockEquipmentAssignments];

export function getEquipment(): EquipmentItem[] {
  return [...equipmentStore];
}

export function getEquipmentById(id: string): EquipmentItem | undefined {
  return equipmentStore.find((e) => e.id === id);
}

export function getAvailableEquipment(): EquipmentItem[] {
  return equipmentStore.filter((e) => e.status === "available");
}

export function getEquipmentAssignments(): EquipmentAssignment[] {
  return [...assignmentStore];
}

export function getActiveEquipmentForPerson(
  personId: string
): Array<EquipmentItem & { assignment: EquipmentAssignment }> {
  return assignmentStore
    .filter((a) => a.personId === personId && !a.returnedAt)
    .map((assignment) => {
      const item = equipmentStore.find((e) => e.id === assignment.equipmentId);
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
  return assignmentStore
    .filter((a) => a.personId === personId)
    .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))
    .map((assignment) => {
      const item = equipmentStore.find((e) => e.id === assignment.equipmentId);
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
  return assignmentStore
    .filter((a) => a.equipmentId === equipmentId)
    .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt));
}

/** Assign available equipment to a crew member (in-memory). */
export function assignEquipmentToPerson(
  equipmentId: string,
  personId: string,
  note?: string
): EquipmentAssignment | null {
  const item = equipmentStore.find((e) => e.id === equipmentId);
  if (!item || item.status !== "available") return null;

  const assignment: EquipmentAssignment = {
    id: `eqa-${Date.now().toString(36)}`,
    equipmentId,
    personId,
    assignedAt: new Date().toISOString().slice(0, 10),
    note,
  };
  assignmentStore = [...assignmentStore, assignment];
  equipmentStore = equipmentStore.map((e) =>
    e.id === equipmentId ? { ...e, status: "assigned" as const } : e
  );
  return assignment;
}
