import { SodaLoading } from "@/components/brand/soda-loading";

/** Full-viewport branded loader during hard refresh / root segment suspense. */
export default function RootLoading() {
  return <SodaLoading messageKey="default" />;
}
