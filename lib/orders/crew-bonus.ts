import { getAssignmentsByPerson } from "@/lib/assignments/repository";
import { getOrderById } from "@/lib/orders/repository";
import {
  CREW_MONTHLY_BONUS_EGP,
  CREW_MONTHLY_BONUS_THRESHOLD,
  isOrderCompleted,
} from "@/lib/orders/status";

/** Monthly crew bonus: 20 completed orders in a calendar month → 3500 EGP. */
export function getCrewMonthlyBonus(
  personId: string,
  monthKey: string
): { completedCount: number; bonusEgp: number; qualified: boolean } {
  const completedIds = new Set<string>();
  for (const a of getAssignmentsByPerson(personId)) {
    const order = getOrderById(a.orderId);
    if (!order || !isOrderCompleted(order.status)) continue;
    const key = (order.deliveryDate || order.shootDate || "").slice(0, 7);
    if (key === monthKey) completedIds.add(order.id);
  }
  const completedCount = completedIds.size;
  const qualified = completedCount >= CREW_MONTHLY_BONUS_THRESHOLD;
  return {
    completedCount,
    bonusEgp: qualified ? CREW_MONTHLY_BONUS_EGP : 0,
    qualified,
  };
}
