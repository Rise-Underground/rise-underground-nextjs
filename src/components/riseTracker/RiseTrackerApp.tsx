"use client";

import { useMemo } from "react";
import { SiteNav } from "@/components/nav/SiteNav";
import { ScanlineOverlay } from "@/components/shared/ScanlineOverlay";
import { DisclaimerModal } from "@/components/shared/DisclaimerModal";
import { BalanceChart } from "./BalanceChart";
import { FlowChart } from "./FlowChart";
import { LpChart } from "./LpChart";
import { SignedFlow } from "./SignedFlow";
import { useDashboardData } from "@/lib/riseTracker/useDashboardData";
import { useCountUp } from "@/lib/riseTracker/useCountUp";
import { buildFlowDays } from "@/lib/riseTracker/flow";
import { formatCompact, formatNum } from "@/lib/riseTracker/format";
import type { RiseTrackerSummaryData } from "@/lib/data/riseTracker";

function StatCard({ label, value, unit }: { label: string; value: React.ReactNode; unit?: string }) {
  return (
    <div>
      <div className="mb-2.5 font-ibm-plex-mono text-xs tracking-[0.06em] text-tracker-muted uppercase">{label}</div>
      <div className="mb-1.5 bg-gradient-to-b from-white to-[#FFC49A] bg-clip-text text-[44px] leading-none font-bold tracking-[-0.02em] text-transparent [font-variant-numeric:tabular-nums]">
        {value}
      </div>
      {unit && <div className="font-ibm-plex-mono text-sm font-medium text-ember">{unit}</div>}
    </div>
  );
}

function ChainStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 font-ibm-plex-mono text-[11px] tracking-[0.06em] text-tracker-muted uppercase">{label}</div>
      <div className="font-oswald text-[22px] font-semibold text-ink [font-variant-numeric:tabular-nums]">{value}</div>
    </div>
  );
}

function ChainGroup({ title, color, cols, children }: { title: string; color: string; cols: string; children: React.ReactNode }) {
  return (
    <div className="w-full md:w-auto rounded-xl border border-tracker-border bg-tracker-surface-2 px-[22px] py-5">
      <div className="mb-3.5 font-ibm-plex-mono text-xs tracking-[0.08em] uppercase" style={{ color }}>
        {title}
      </div>
      <div className={`grid gap-4 ${cols}`}>{children}</div>
    </div>
  );
}

export function RiseTrackerApp({ summary, flowWindows, volumeWindows, error, poolError }: RiseTrackerSummaryData) {
  // The charts need the full multi-year time series behind these numbers -- a different order of
  // magnitude of data with no SEO value, so that half stays client-fetched (see useDashboardData.ts)
  // rather than blocking this page's initial render the way the stat grid below no longer does.
  const { data: chartData, poolData: chartPoolData } = useDashboardData();

  const flowDays = useMemo(() => (chartData ? buildFlowDays(chartData.stake_days, "total_staked") : []), [chartData]);

  const heroValue = useCountUp(summary ? summary.final_total_staked : null);
  const heroRewards = useCountUp(summary ? summary.final_total_rewards : null);

  return (
    <div className="min-h-full bg-tracker-bg text-ink">
      <ScanlineOverlay />
      <DisclaimerModal storageKey="riseTrackerDisclaimerDismissedAt" title="A Note On This Data">
        The RISE/COPI token ecosystem is highly complex, spanning four chains, multiple staking and
        rewards avenues, and a token migration — not to mention the difficulty of reconciling data
        across both EVM and UTXO chains. To the best of our ability, we&apos;ve pieced it all together
        to bring you this dashboard, and we hope to add even more information over time. That said,
        we had to make some assumptions along the way that, if incorrect, could lead to imperfect
        data. This dashboard is provided for informational purposes only, to give the community a
        general view of RISE token flow, and should not be used to make financial decisions.
      </DisclaimerModal>

      <SiteNav current="/rise-tracker" />

      <div className="mx-auto max-w-[2200px] px-7 pt-14 pb-24">
        <div className="mb-[18px] flex items-center gap-2 font-ibm-plex-mono text-xs tracking-[0.14em] text-ember uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-ember shadow-[0_0_8px_2px_rgba(255,122,41,0.7)]" />
          Infinity Rising
        </div>
        <h1 className="mb-2.5 font-oswald text-[clamp(28px,4vw,40px)] font-bold tracking-[-0.01em]">RISE Tracker</h1>

        {error && (
          <div className="mb-6 rounded-xl border border-tracker-red bg-[#2a1414] p-5 font-ibm-plex-mono text-[13px] text-ink">
            Could not load dashboard data ({error}).
          </div>
        )}

        {summary && flowWindows && (
          <>
            <div className="rounded-2xl border border-tracker-border bg-gradient-to-b from-tracker-surface to-tracker-surface-2 p-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Total Currently Staked" value={formatNum(heroValue)} unit="RISE" />
                <StatCard label="Net Flow — 7D" value={<SignedFlow value={flowWindows.total.d7} />} />
                <StatCard label="Net Flow — 30D" value={<SignedFlow value={flowWindows.total.d30} />} />
                <StatCard label="Total Rewards (RISE)" value={formatNum(heroRewards)} />
              </div>

              <div className="mt-7 grid grid-cols-1 gap-4 border-t border-tracker-border pt-6 md:grid-cols-2">
                <ChainGroup title="Cardano" color="var(--color-tracker-red)" cols="grid-1 xs:grid-cols-[1.2fr_1fr_1fr]">
                  <ChainStat label="Staked" value={formatCompact(summary.final_cardano_staked)} />
                  <ChainStat label="7D Flow" value={<SignedFlow value={flowWindows.cardano.d7} />} />
                  <ChainStat label="30D Flow" value={<SignedFlow value={flowWindows.cardano.d30} />} />
                </ChainGroup>
                <ChainGroup title="Base" color="var(--color-ice)" cols="grid-cols-1 xs:grid-cols-4">
                  <ChainStat label="Staked" value={formatCompact(summary.final_base_staked) + " RISE"} />
                  <ChainStat label="7D Flow" value={<SignedFlow value={flowWindows.base.d7} />} />
                  <ChainStat label="30D Flow" value={<SignedFlow value={flowWindows.base.d30} />} />
                  <ChainStat label="Avg. Age Staked" value={summary.final_avg_age_days.toFixed(1) + " days"} />
                </ChainGroup>
              </div>

              <div className="mt-4 flex flex-wrap gap-4">
                <ChainGroup title="Node Rewards" color="var(--color-gold)" cols="grid-cols-1">
                  <ChainStat label="" value={formatCompact(summary.final_total_node_rewards) + " RISE/COPI"} />
                </ChainGroup>
                <ChainGroup title="Trading Volume (RISE) — All Venues" color="var(--color-ice)" cols="grid-cols-1 xxs:grid-cols-3">
                  <ChainStat
                    label="24H Net Flow"
                    value={volumeWindows ? <SignedFlow value={volumeWindows.d1} /> : poolError ? "N/A" : "…"}
                  />
                  <ChainStat
                    label="7D Net Flow"
                    value={volumeWindows ? <SignedFlow value={volumeWindows.d7} /> : poolError ? "N/A" : "…"}
                  />
                  <ChainStat
                    label="30D Net Flow"
                    value={volumeWindows ? <SignedFlow value={volumeWindows.d30} /> : poolError ? "N/A" : "…"}
                  />
                </ChainGroup>
                <ChainGroup title="Migration COPI to RISE" color="var(--color-gold)" cols="grid-cols-1 xxs:grid-cols-3">
                  <ChainStat
                    label="Total"
                    value={summary.migrated_total != null ? formatCompact(summary.migrated_total) : "N/A"}
                  />
                  <ChainStat
                    label="7D Migrated"
                    value={summary.migrated_last_7_days != null ? formatCompact(summary.migrated_last_7_days) : "N/A"}
                  />
                  <ChainStat
                    label="30D Migrated"
                    value={summary.migrated_last_30_days != null ? formatCompact(summary.migrated_last_30_days) : "N/A"}
                  />
                </ChainGroup>
                <ChainGroup title="Circulating Supply" color="var(--color-gold)" cols="grid-cols-1">
                  <ChainStat
                    label="Circulating Supply est."
                    value={summary.estimated_circulating_supply != null ? formatCompact(summary.estimated_circulating_supply) : "N/A"}
                  />
                </ChainGroup>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-tracker-border bg-gradient-to-b from-tracker-surface to-tracker-surface-2 p-[26px]">
                <div className="mb-[18px]">
                  <div className="font-oswald text-[17px] font-semibold">Cumulative Staked Balance</div>
                  <div className="mt-1 text-[12.5px] text-tracker-muted">Cardano + Base combined, running total</div>
                </div>
                <div className="h-[320px]">
                  <BalanceChart flowDays={flowDays} />
                </div>
              </div>
              <div className="rounded-2xl border border-tracker-border bg-gradient-to-b from-tracker-surface to-tracker-surface-2 p-[26px]">
                <div className="mb-[18px] flex flex-wrap items-end justify-between gap-2.5">
                  <div>
                    <div className="font-oswald text-[17px] font-semibold">Daily Net Flow &amp; 7-Day Rolling Average</div>
                    <div className="mt-1 text-[12.5px] text-tracker-muted">Cardano + Base combined · axis clipped, arrows mark days off-scale</div>
                  </div>
                  <div className="flex gap-4 font-ibm-plex-mono text-xs text-tracker-muted">
                    <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-tracker-green" />Inflow</span>
                    <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-tracker-red" />Outflow</span>
                    <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-ember" />7-day avg</span>
                  </div>
                </div>
                <div className="h-[320px]">
                  <FlowChart flowDays={flowDays} />
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-tracker-border bg-gradient-to-b from-tracker-surface to-tracker-surface-2 p-[26px]">
              <div className="mb-[18px] flex flex-wrap items-baseline justify-between gap-2.5">
                <div className="flex flex-wrap items-baseline gap-3.5">
                  <div className="font-oswald text-[17px] font-semibold">Cumulative LP Tokens Staked &amp; Minswap Liquidity</div>
                  <div className="max-w-[420px] font-ibm-plex-mono text-[11.5px] leading-tight text-ember">
                    Note: we are trying to resolve the data for the Minswap pool so it does not incorrectly show massive LP removals and adds as part of its normal rebalancing.
                  </div>
                </div>
                <div className="flex gap-4 font-ibm-plex-mono text-xs text-tracker-muted">
                  <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-violet" />Aerodrome (vAMM-WETH/RISE)</span>
                  <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-violet-2" />Uniswap V2 (UNI-V2)</span>
                  <span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-ember" />Minswap (RISE/ADA)</span>
                </div>
              </div>
              <div className="h-[320px]">
                {chartData && <LpChart lpStaking={chartData.lp_staking} poolRows={chartPoolData?.daily_summary ?? null} />}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
