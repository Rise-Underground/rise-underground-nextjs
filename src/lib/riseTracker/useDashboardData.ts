import { useEffect, useState } from "react";
import type { CombinedDashboardData, PoolSummaryData } from "@/types/riseTracker";

interface State {
  data: CombinedDashboardData | null;
  poolData: PoolSummaryData | null;
  /** Fatal: the whole page has nothing to show without this. */
  error: string | null;
  /** Non-fatal: trading-volume/Minswap sections degrade to "N/A" instead of breaking the page. */
  poolError: boolean;
  loading: boolean;
}

/** Client-side fetch of both dashboard JSON files -- see api/dashboard-data and api/pool-summary route.ts for why this isn't server-fetched. */
export function useDashboardData(): State {
  const [state, setState] = useState<State>({
    data: null,
    poolData: null,
    error: null,
    poolError: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      let data: CombinedDashboardData;
      try {
        const res = await fetch("/api/dashboard-data");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
      } catch (err) {
        if (!cancelled) {
          setState({
            data: null,
            poolData: null,
            error: err instanceof Error ? err.message : "Unknown error",
            poolError: false,
            loading: false,
          });
        }
        return;
      }

      let poolData: PoolSummaryData | null = null;
      let poolError = false;
      try {
        const res = await fetch("/api/pool-summary");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        poolData = await res.json();
      } catch {
        poolError = true; // non-fatal -- rest of the dashboard still renders
      }

      if (!cancelled) setState({ data, poolData, error: null, poolError, loading: false });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
