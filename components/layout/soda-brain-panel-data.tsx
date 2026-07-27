import { loadCommandCenterBrainPanel } from "@/lib/brain/command-center-panel";
import { SodaBrainPanelClient } from "@/components/layout/soda-brain-panel-client";

/** Server wrapper — loads real Brain panel data for Founder shell rail. */
export async function SodaBrainPanelData() {
  const data = await loadCommandCenterBrainPanel();
  return <SodaBrainPanelClient data={data} variant="rail" />;
}

/** Serializable payload for client drawer (same data, passed from layout). */
export async function loadBrainPanelForShell() {
  return loadCommandCenterBrainPanel();
}
