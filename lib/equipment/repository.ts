import { publishBusinessEvent } from "@/lib/core/publish";
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
  note?: string,
  opts?: {
    orderId?: string;
    projectId?: string;
    startsOn?: string;
    endsOn?: string;
  }
): Promise<EquipmentAssignment | null> {
  const item = getEquipmentById(equipmentId);
  if (!item || item.status !== "available") return null;

  const startsOn = opts?.startsOn;
  const endsOn = opts?.endsOn ?? opts?.startsOn;
  if (startsOn && endsOn) {
    const conflict = findEquipmentDateConflict(equipmentId, startsOn, endsOn);
    if (conflict) {
      throw new Error(
        `Equipment already booked ${conflict.startsOn ?? conflict.assignedAt}` +
          (conflict.endsOn ? `–${conflict.endsOn}` : "") +
          (conflict.orderId ? ` (order ${conflict.orderId})` : "")
      );
    }
  }

  const assignment: EquipmentAssignment = {
    id: newId("eqa"),
    equipmentId,
    personId,
    assignedAt: new Date().toISOString().slice(0, 10),
    note,
    ...(opts?.orderId ? { orderId: opts.orderId } : {}),
    ...(opts?.projectId ? { projectId: opts.projectId } : {}),
    ...(startsOn ? { startsOn } : {}),
    ...(endsOn ? { endsOn } : {}),
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
  await publishBusinessEvent({
    type: "EquipmentAssigned",
    source: "equipment.repository.assignEquipmentToPerson",
    payload: {
      entityId: savedAsg.id,
      entityType: "equipment",
      equipmentId: savedAsg.equipmentId,
      personId: savedAsg.personId,
      orderId: savedAsg.orderId,
      projectId: savedAsg.projectId,
      summary: `Equipment ${savedAsg.equipmentId} assigned to ${savedAsg.personId}`,
      data: {
        startsOn: savedAsg.startsOn,
        endsOn: savedAsg.endsOn,
      },
    },
  });
  return { ...savedAsg };
}

/** Active open bookings that overlap [startsOn, endsOn] inclusive. */
export function findEquipmentDateConflict(
  equipmentId: string,
  startsOn: string,
  endsOn: string,
  excludeAssignmentId?: string
): EquipmentAssignment | undefined {
  return assignmentCache.find((a) => {
    if (a.equipmentId !== equipmentId) return false;
    if (a.returnedAt) return false;
    if (excludeAssignmentId && a.id === excludeAssignmentId) return false;
    const aStart = a.startsOn ?? a.assignedAt;
    const aEnd = a.endsOn ?? a.startsOn ?? a.assignedAt;
    if (!aStart || !aEnd) {
      // Open checkout without dates blocks until returned
      return true;
    }
    return aStart <= endsOn && aEnd >= startsOn;
  });
}

export function getEquipmentAssignmentsByOrder(
  orderId: string
): EquipmentAssignment[] {
  return assignmentCache.filter((a) => a.orderId === orderId);
}

export function isEquipmentAvailableForDates(
  equipmentId: string,
  startsOn: string,
  endsOn: string
): boolean {
  const item = getEquipmentById(equipmentId);
  if (!item) return false;
  if (item.status === "maintenance" || item.status === "retired") return false;
  if (item.status === "available") {
    return !findEquipmentDateConflict(equipmentId, startsOn, endsOn);
  }
  // Already assigned: only ok if no overlapping date booking
  return !findEquipmentDateConflict(equipmentId, startsOn, endsOn);
}

/** Active (not returned) equipment assignments for a crew member. */
export function getEquipmentAssignmentsByPerson(
  personId: string
): EquipmentAssignment[] {
  return assignmentCache.filter(
    (a) => a.personId === personId && !a.returnedAt
  );
}

/** Mark equipment assignment returned and set item available. */
export async function releaseEquipmentAssignment(
  assignmentId: string
): Promise<EquipmentAssignment | null> {
  const current = assignmentCache.find((a) => a.id === assignmentId);
  if (!current || current.returnedAt) return current ?? null;

  const returnedAt = new Date().toISOString().slice(0, 10);
  const db = createEquipmentDb();
  const { data: asgData, error: asgErr } = await db
    .from("equipment_assignments")
    .update({ returned_at: returnedAt })
    .eq("id", assignmentId)
    .select("*")
    .single();
  if (asgErr) {
    throw new Error(`Failed to release equipment assignment: ${asgErr.message}`);
  }

  const { data: eqData, error: eqErr } = await db
    .from("equipment")
    .update({ status: "available" })
    .eq("id", current.equipmentId)
    .select("*")
    .single();
  if (eqErr) {
    throw new Error(`Failed to mark equipment available: ${eqErr.message}`);
  }

  const savedAsg = rowToAssignment(asgData as EquipmentAssignmentRow);
  upsertAssignmentCache(savedAsg);
  upsertEquipmentCache(rowToEquipment(eqData as EquipmentRow));
  await publishBusinessEvent({
    type: "EquipmentReturned",
    source: "equipment.repository.releaseEquipmentAssignment",
    payload: {
      entityId: savedAsg.id,
      entityType: "equipment",
      equipmentId: savedAsg.equipmentId,
      personId: savedAsg.personId,
      summary: `Equipment ${savedAsg.equipmentId} returned`,
      data: { returnedAt: savedAsg.returnedAt },
    },
  });
  return { ...savedAsg };
}
