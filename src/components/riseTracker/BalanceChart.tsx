"use client";

import { useEffect, useRef } from "react";
import { Chart, ensureChartRegistered } from "@/lib/riseTracker/chartSetup";
import { formatNum } from "@/lib/riseTracker/format";
import type { FlowDay } from "@/types/riseTracker";

/** Cumulative staked balance, area line. */
export function BalanceChart({ flowDays }: { flowDays: FlowDay[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    ensureChartRegistered();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, "rgba(255,122,41,0.35)");
    gradient.addColorStop(1, "rgba(255,122,41,0.0)");

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: flowDays.map((d) => d.date),
        datasets: [
          {
            data: flowDays.map((d) => d.cumulative),
            borderColor: "#FF7A29",
            backgroundColor: gradient,
            borderWidth: 2.2,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: "#FF7A29",
            fill: true,
            tension: 0.25,
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
            callbacks: { label: (ctx) => "Staked: " + formatNum(Number(ctx.parsed.y)) + " RISE" },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 10 } } },
          y: {
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: { font: { size: 10 }, callback: (v) => (Number(v) / 1e6).toFixed(0) + "M" },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [flowDays]);

  return <canvas ref={canvasRef} />;
}
