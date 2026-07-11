import { createEquipmentDb } from "@/lib/equipment/db";
import {
  assignmentToRow,
  equipmentToRow,
  rowToAssignment,
  rowToEquipment,
  type EquipmentAssignmentRow,
  type EquipmentRow,
} from "@/lib/equipment/mappers";
import type {
  EquipmentAssignment,
  EquipmentItem,
} from "@/lib/equipment/types";

let equipmentCache: EquipmentItem[] = [];
let assignmentCache: EquipmentAssignment[] = [];

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}`;
}

function upsertEquipmentCache(item: EquipmentItem): void {
  equipmentCache = [
    item,
    ...equipmentCache.filter((e) => e.id !== item.id),
  ];
}

function upsertAssignmentCache(a: EquipmentAssignment): void {
  assignmentCache = [
    a,
    ...assignmentCache.filter((x) => x.id !== a.id),
  ];
}

/** Load equipment + assignments from Supabase into sync caches. */
export async function refreshEquipment(): Promise<EquipmentItem[]> {
  const db = createEquipmentDb();
  const [eq, asg] = await Promise.all([
    db.from("equipment").select("*").order("name", { ascending: true }),
    db
      .from("equipment_assignments")
      .select("*")
      .order("assigned_at", { ascending: false }),
  ]);
  if (eq.error) {
    throw new Error(`Failed to load equipment: ${eq.error.message}`);
  }
  if (asg.error) {
    throw new Error(
      `Failed to load equipment assignments: ${asg.error.message}`
    );
  }
  equipmentCache = ((eq.data ?? []) as EquipmentRow[]).map(rowToEquipment);
  assignmentCache = ((asg.data ?? []) as EquipmentAssignmentRow[]).map(
    rowToAssignment
  );
  return [...equipmentCache];
}

export function getEquipment(): EquipmentItem[] {
  return [...equipmentCache];
}

export function getEquipmentById(id: string): EquipmentItem | undefined {
  return equipmentCache.find((e) => e.id === id);
}

export function getAvailableEquipment(): EquipmentItem[] {
  return equipmentCache.filter((e) => e.status === "available");
}

export function getEquipmentAssignments(): EquipmentAssignment[] {
  return [...assignmentCache];
}

export function getActiveEquipmentForPerson(
  personId: string
): Array<EquipmentItem & { assignment: EquipmentAssignment }> {
  return assignmentCache
    .filter((a) => a.personId === personId && !a.returnedAt)
    .map((assignment) => {
      const item = equipmentCache.find((e) => e.id === assignment.equipmentId);
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
  return assignmentCache
    .filter((a) => a.personId === personId)
    .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt))
    .map((assignment) => {
      const item = equipmentCache.find((e) => e.id === assignment.equipmentId);
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
  return assignmentCache
    .filter((a) => a.equipmentId === equipmentId)
    .sort((a, b) => b.assignedAt.localeCompare(a.assignedAt));
}

export type NewEquipmentInput = Omit<EquipmentItem, "id" | "status"> & {
  status?: EquipmentItem["status"];
};

/** Persist a new equipment item. */
export async function createEquipment(
  input: NewEquipmentInput
): Promise<EquipmentItem> {
  const item: EquipmentItem = {
    id: newId("eq"),
    name: input.name,
    type: input.type,
    serialNumber: input.serialNumber,
    status: input.status ?? "available",
    notes: input.notes,
    acquiredAt: input.acquiredAt,
  };
  const db = createEquipmentDb();
  const { data, error } = await db
    .from("equipment")
    .insert(equipmentToRow(item))
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to create equipment: ${error.message}`);
  }
  const saved = rowToEquipment(data as EquipmentRow);
  upsertEquipmentCache(saved);
  return { ...saved };
}

/** Update equipment fields. */
export async function updateEquipment(
  id: string,
  patch: Partial<Omit<EquipmentItem, "id">>
): Promise<EquipmentItem> {
  const existing = getEquipmentById(id);
  if (!existing) throw new Error(`Equipment not found: ${id}`);
  const merged: EquipmentItem = { ...existing, ...patch, id };
  const db = createEquipmentDb();
  const row = equipmentToRow(merged);
  delete row.id;
  const { data, error } = await db
    .from("equipment")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    throw new Error(`Failed to update equipment: ${error.message}`);
  }
  const saved = rowToEquipment(data as EquipmentRow);
  upsertEquipmentCache(saved);
  return { ...saved };
}

/** Hard-delete equipment. */
export async function deleteEquipment(id: string): Promise<void> {
  const db = createEquipmentDb();
  const { error } = await db.from("equipment").delete().eq("id", id);
  if (error) {
    throw new Error(`Failed to delete equipment: ${error.message}`);
  }
  equipmentCache = equipmentCache.filter((e) => e.id !== id);
  assignmentCache = assignmentCache.filter((a) => a.equipmentId !== id);
}

/** Assign available equipment to a crew member. */
export async function assignEquipmentToPerson(
  equipmentId: string,
  personId: string,
  note?: string
): Promise<EquipmentAssignment | null> {
  const item = getEquipmentById(equipmentId);
  if (!item || item.status !== "available") return null;

  const assignment: EquipmentAssignment = {
    id: newId("eqa"),
    equipmentId,
    personId,
    assignedAt: new Date().toISOString().slice(0, 10),
    note,
  };

  const db = createEquipmentDb();
  const { data: asgData, error: asgErr } = await db
    .from("equipment_assignments")
    .insert(assignmentToRow(assignment))
    .select("*")
    .single();
  if (asgErr) {
    throw new Error(`Failed to assign equipment: ${asgErr.message}`);
  }

  const { data: eqData, error: eqErr } = await db
    .from("equipment")
    .update({ status: "assigned" })
    .eq("id", equipmentId)
    .select("*")
    .single();
  if (eqErr) {
    throw new Error(`Failed to mark equipment assigned: ${eqErr.message}`);
  }

  const savedAsg = rowToAssignment(asgData as EquipmentAssignmentRow);
  upsertAssignmentCache(savedAsg);
  upsertEquipmentCache(rowToEquipment(eqData as EquipmentRow));
  return { ...savedAsg };
}
