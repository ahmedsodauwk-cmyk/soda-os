/**
 * Business Integration layer — connects modules into one operating flow.
 *
 * Commercial Lead → Quotation → Order → Project → Crew → Finance
 */

export {
  assignCrewToOrder,
  emitCrewPayment,
  emitOrderClientPayment,
  emitQuotationDeposit,
  linkOrderToProject,
  payCrewAssignment,
  runQuotationConversionFlow,
  type PayCrewAssignmentResult,
  type QuotationConversionFlowResult,
} from "@/lib/integration/flows";

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
