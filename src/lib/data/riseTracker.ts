import { fetchSourceFile, SOURCE_PATHS } from "./source";
import { buildFlowDays, sumWindow, computeVolumeWindows } from "@/lib/riseTracker/flow";
import type { DashboardSummary, PoolDailySummary } from "@/types/riseTracker";

interface FlowWindow {
  d7: number;
  d30: number;
}

export interface VolumeWindows {
  d1: number;
  d7: number;
  d30: number;
}

export interface RiseTrackerSummaryData {
  summary: DashboardSummary | null;
  flowWindows: { total: FlowWindow; cardano: FlowWindow; base: FlowWindow } | null;
  volumeWindows: VolumeWindows | null;
  error: string | null;
  poolError: boolean;
}

/**
 * The small, immediately-renderable half of the RISE tracker's data -- the stat grid's numbers
 * (hero stats, chain flow windows, migration, circulating supply, trading volume windows). Fetched
 * server-side so the stat grid never shows a loading state. The 3 charts need the *full* multi-year
 * time series behind these numbers (a different order of magnitude of data, with no SEO value since
 * it only ever feeds a <canvas>) -- that part stays client-fetched, see useDashboardData.ts.
 */
export async function fetchRiseTrackerSummary(): Promise<RiseTrackerSummaryData> {
  let stakeDays;
  let summary: DashboardSummary;
  try {
    const { text } = await fetchSourceFile(SOURCE_PATHS.dashboardData);
    const data = JSON.parse(text);
    summary = data.summary;
    stakeDays = data.stake_days;
  } catch (err) {
    return {
      summary: null,
      flowWindows: null,
      volumeWindows: null,
      error: err instanceof Error ? err.message : "Unknown error",
      poolError: false,
    };
  }

  const totalFlow = buildFlowDays(stakeDays, "total_staked").map((d) => d.net);
  const cardanoFlow = buildFlowDays(stakeDays, "cardano_staked").map((d) => d.net);
  const baseFlow = buildFlowDays(stakeDays, "base_staked").map((d) => d.net);
  const flowWindows = {
    total: { d7: sumWindow(totalFlow, 7), d30: sumWindow(totalFlow, 30) },
    cardano: { d7: sumWindow(cardanoFlow, 7), d30: sumWindow(cardanoFlow, 30) },
    base: { d7: sumWindow(baseFlow, 7), d30: sumWindow(baseFlow, 30) },
  };

  let volumeWindows: VolumeWindows | null = null;
  let poolError = false;
  try {
    const { text } = await fetchSourceFile(SOURCE_PATHS.poolSummary);
    const poolData: { daily_summary: PoolDailySummary[] } = JSON.parse(text);
    const windows = computeVolumeWindows(poolData.daily_summary);
    volumeWindows = { d1: windows.d1.net, d7: windows.d7.net, d30: windows.d30.net };
  } catch {
    poolError = true; // non-fatal -- the rest of the stat grid still renders
  }

  return { summary, flowWindows, volumeWindows, error: null, poolError };
}
