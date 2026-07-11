import type {
  EquipmentAssignment,
  EquipmentItem,
  EquipmentStatus,
  EquipmentType,
} from "@/lib/equipment/types";

export type EquipmentRow = {
  id: string;
  name: string;
  type: string;
  serial_number: string | null;
  status: string;
  notes: string | null;
  acquired_at: string;
  created_at?: string;
  updated_at?: string;
};

export type EquipmentAssignmentRow = {
  id: string;
  equipment_id: string;
  person_id: string;
  assigned_at: string;
  returned_at: string | null;
  note: string | null;
  created_at?: string;
};

export function rowToEquipment(row: EquipmentRow): EquipmentItem {
  return {
    id: row.id,
    name: row.name,
    type: row.type as EquipmentType,
    ...(row.serial_number ? { serialNumber: row.serial_number } : {}),
    status: row.status as EquipmentStatus,
    ...(row.notes ? { notes: row.notes } : {}),
    acquiredAt: row.acquired_at,
  };
}

export function equipmentToRow(item: EquipmentItem): Record<string, unknown> {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    serial_number: item.serialNumber ?? null,
    status: item.status,
    notes: item.notes ?? null,
    acquired_at: item.acquiredAt,
  };
}

export function rowToAssignment(row: EquipmentAssignmentRow): EquipmentAssignment {
  return {
    id: row.id,
    equipmentId: row.equipment_id,
    personId: row.person_id,
    assignedAt: row.assigned_at.slice(0, 10),
    ...(row.returned_at
      ? { returnedAt: row.returned_at.slice(0, 10) }
      : {}),
    ...(row.note ? { note: row.note } : {}),
  };
}

export function assignmentToRow(
  a: EquipmentAssignment
): Record<string, unknown> {
  return {
    id: a.id,
    equipment_id: a.equipmentId,
    person_id: a.personId,
    assigned_at: a.assignedAt,
    returned_at: a.returnedAt ?? null,
    note: a.note ?? null,
  };
}
