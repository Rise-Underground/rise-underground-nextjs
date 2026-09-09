"use client";

import { useEffect, useRef } from "react";
import { Chart, ensureChartRegistered } from "@/lib/riseTracker/chartSetup";
import { formatNum, formatCompact } from "@/lib/riseTracker/format";
import { buildMinswapSeries } from "@/lib/riseTracker/flow";
import type { CombinedDashboardData, PoolDailySummary } from "@/types/riseTracker";

/**
 * Cumulative LP tokens staked (Aerodrome + Uniswap V2, left axis) plus Minswap net liquidity
 * (right axis, dashed, forward-filled).
 */
export function LpChart({
  lpStaking,
  poolRows,
}: {
  lpStaking: CombinedDashboardData["lp_staking"];
  poolRows: PoolDailySummary[] | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    ensureChartRegistered();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const aeroDays = lpStaking.lp_rise_weth_aero.days;
    const univ2ByDate = new Map(lpStaking.lp_rise_weth_univ2.days.map((d) => [d.date, d.cumulative_balance]));
    const dateAxis = aeroDays.map((d) => d.date);
    const minswapSeries = poolRows ? buildMinswapSeries(poolRows, dateAxis) : dateAxis.map(() => null);

    chartRef.current = new Chart(canvas, {
      type: "line",
      data: {
        labels: dateAxis,
        datasets: [
          {
            label: "Aerodrome",
            data: aeroDays.map((d) => d.cumulative_balance),
            borderColor: "#B98AFF",
            borderWidth: 2.2,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: "#B98AFF",
            tension: 0.25,
            spanGaps: true,
            yAxisID: "y",
          },
          {
            label: "Uniswap V2",
            data: dateAxis.map((d) => (univ2ByDate.has(d) ? univ2ByDate.get(d)! : null)),
            borderColor: "#5FE0D0",
            borderWidth: 2.2,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: "#5FE0D0",
            tension: 0.25,
            spanGaps: false,
            yAxisID: "y",
          },
          {
            label: "Minswap",
            data: minswapSeries,
            borderColor: "#FF7A29",
            borderWidth: 2.2,
            borderDash: [4, 3],
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: "#FF7A29",
            tension: 0.25,
            spanGaps: true,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#171B24",
            borderColor: "#232838",
            borderWidth: 1,
            titleFont: { family: "'IBM Plex Mono', monospace", size: 11 },
            bodyFont: { family: "'IBM Plex Mono', monospace", size: 12 },
            callbacks: {
              label: (ctx) => {
                if (ctx.parsed.y === null) return "";
                const unit =
                  ctx.dataset.label === "Aerodrome"
                    ? "vAMM-WETH/RISE"
                    : ctx.dataset.label === "Uniswap V2"
                      ? "UNI-V2"
                      : "RISE (net added via Minswap LP events)";
                return ctx.dataset.label + ": " + formatNum(ctx.parsed.y as number) + " " + unit;
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 10 } } },
          y: {
            position: "left",
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: { font: { size: 10 }, callback: (v) => formatCompact(Number(v)) },
          },
          y1: {
            position: "right",
            grid: { display: false },
            ticks: { font: { size: 10 }, callback: (v) => formatCompact(Number(v)) },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [lpStaking, poolRows]);

  return <canvas ref={canvasRef} />;
}
