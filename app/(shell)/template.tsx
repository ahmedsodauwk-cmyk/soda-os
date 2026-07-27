import { RouteTransition } from "@/components/layout/route-transition";

/** Re-mounts on navigation — pairs with RouteTransition for enter/exit motion. */
export default function ShellTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RouteTransition>{children}</RouteTransition>;
}
