import type { FlowDay, PoolDailySummary, StakeDay } from "@/types/riseTracker";

/** Day-by-day net delta + 7-day rolling average, derived from a cumulative stake_days series. */
export function buildFlowDays(days: StakeDay[], valueKey: "total_staked" | "cardano_staked" | "base_staked"): FlowDay[] {
  const out: FlowDay[] = [];
  let prevValue: number | null = null;
  const deltas: number[] = [];
  for (const row of days) {
    const value = row[valueKey];
    const delta = prevValue === null ? 0 : value - prevValue;
    deltas.push(delta);
    const window = deltas.slice(Math.max(0, deltas.length - 7));
    const rollingAvg = window.reduce((a, b) => a + b, 0) / window.length;
    out.push({ date: row.date, net: delta, rollingAvg, cumulative: value });
    prevValue = value;
  }
  return out;
}

export function sumWindow(deltas: number[], days: number): number {
  return deltas.slice(-days).reduce((sum, v) => sum + v, 0);
}

interface VolumeWindow {
  net: number;
}

/** Sums buy_volume + sell_volume across every chain/pool for each date, then windows the last N days. */
export function computeVolumeWindows(rows: PoolDailySummary[]): { d1: VolumeWindow; d7: VolumeWindow; d30: VolumeWindow } {
  const byDate = new Map<string, { buy: number; sell: number }>();
  for (const r of rows) {
    const entry = byDate.get(r.date) ?? { buy: 0, sell: 0 };
    entry.buy += r.buy_volume || 0;
    entry.sell += r.sell_volume || 0;
    byDate.set(r.date, entry);
  }
  const dates = Array.from(byDate.keys()).sort();

  function windowFor(days: number): VolumeWindow {
    const window = dates.slice(-days);
    let buy = 0;
    let sell = 0;
    for (const d of window) {
      const entry = byDate.get(d)!;
      buy += entry.buy;
      sell += entry.sell;
    }
    return { net: buy - sell };
  }

  return { d1: windowFor(1), d7: windowFor(7), d30: windowFor(30) };
}

/**
 * Minswap has no separate LP-token balance the way Aerodrome/Uniswap V2 do -- pool_summary.json
 * only records RISE/ADA amounts per add/remove event, so this is "cumulative net RISE added via
 * Minswap liquidity events," not a token count. Forward-filled onto the given date axis (the
 * Aerodrome series) so the line is continuous rather than only showing points on event days.
 */
export function buildMinswapSeries(rows: PoolDailySummary[], dateAxis: string[]): (number | null)[] {
  const minswapRows = rows
    .filter((r) => r.chain === "Cardano" && r.pool_name === "Minswap RISE/ADA")
    .sort((a, b) => a.date.localeCompare(b.date));

  const byDate = new Map<string, number>();
  let running = 0;
  for (const r of minswapRows) {
    running += (r.lp_add_volume || 0) - (r.lp_remove_volume || 0);
    byDate.set(r.date, running);
  }

  const series: (number | null)[] = [];
  let last: number | null = null;
  for (const date of dateAxis) {
    if (byDate.has(date)) last = byDate.get(date)!;
    series.push(last);
  }
  return series;
}
