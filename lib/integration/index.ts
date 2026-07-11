/**
 * Business Integration layer — connects modules into one operating flow.
 *
 * Commercial Lead → Quotation → Order → Project → Crew → Finance
 */

export {
  advanceProjectJourney,
  assignCrewToOrder,
  emitCrewPayment,
  emitOrderClientPayment,
  emitQuotationDeposit,
  finishProject,
  linkOrderToProject,
  markShootComplete,
  payCrewAssignment,
  runQuotationConversionFlow,
  type PayCrewAssignmentResult,
  type QuotationConversionFlowResult,
} from "@/lib/integration/flows";

export {
  applyOrderStatus,
  cancelOrder,
  completeOrder,
  confirmOrder,
  createClientInline,
  createSmartOrder,
  getClientOrderContext,
  getCrewMonthlyBonus,
  updateSmartOrder,
  type ClientOrderContext,
  type OrderTransitionResult,
  type SmartOrderResult,
} from "@/lib/orders/engine";

export {
  getAssignedProjectsForPerson,
  getClientOperatingView,
  getClientOrders,
  getCrewOperatingView,
  getProjectOperatingView,
  listAllPayments,
  listLinkedProjects,
  type ClientOperatingView,
  type CrewOperatingView,
  type ProjectOperatingView,
} from "@/lib/integration/queries";
