"use client";

import { useEffect, useRef } from "react";
import { Chart, ensureChartRegistered } from "@/lib/riseTracker/chartSetup";
import { formatNum } from "@/lib/riseTracker/format";
import type { FlowDay } from "@/types/riseTracker";
import type { Plugin } from "chart.js";

const Y_MIN = -6_000_000;
const Y_MAX = 7_000_000;

/**
 * Draws small arrow + value callouts for any day whose net flow is clipped off the fixed y-axis
 * range, stacking neighboring callouts so they don't overlap.
 */
function makeClippedDayPlugin(flowDays: FlowDay[]): Plugin<"bar"> {
  return {
    id: "clippedDayCallouts",
    afterDatasetsDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      ctx.save();
      ctx.font = "500 10px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";

      const above: { x: number; d: FlowDay }[] = [];
      const below: { x: number; d: FlowDay }[] = [];
      flowDays.forEach((d, i) => {
        if (d.net > Y_MAX) above.push({ x: scales.x.getPixelForValue(i), d });
        else if (d.net < Y_MIN) below.push({ x: scales.x.getPixelForValue(i), d });
      });

      const CLUSTER_PX = 46;
      const STEP = 15;
      function draw(list: { x: number; d: FlowDay }[], isAbove: boolean) {
        list.sort((a, b) => a.x - b.x);
        let lastX = -Infinity;
        let stack = 0;
        list.forEach(({ x, d }) => {
          stack = x - lastX < CLUSTER_PX ? stack + 1 : 0;
          lastX = x;
          const extra = stack * STEP;
          const y = isAbove ? chartArea.top - extra : chartArea.bottom + extra;
          const label = (d.net >= 0 ? "+" : "") + (d.net / 1e6).toFixed(1) + "M";
          ctx.fillStyle = d.net >= 0 ? "#35D07F" : "#FF5468";
          ctx.beginPath();
          if (isAbove) {
            ctx.moveTo(x, y - 2);
            ctx.lineTo(x - 4, y + 6);
            ctx.lineTo(x + 4, y + 6);
          } else {
            ctx.moveTo(x, y + 2);
            ctx.lineTo(x - 4, y - 6);
            ctx.lineTo(x + 4, y - 6);
          }
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#F2EFE9";
          ctx.fillText(label, x, isAbove ? y - 6 : y + 16);
        });
      }
      draw(above, true);
      draw(below, false);

      ctx.restore();
    },
  };
}

/** Daily net flow (bar) + 7-day rolling average (line). */
export function FlowChart({ flowDays }: { flowDays: FlowDay[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    ensureChartRegistered();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const netFlow = flowDays.map((d) => d.net);
    const rollingAvg = flowDays.map((d) => d.rollingAvg);
    const flowColors = netFlow.map((v) => (v >= 0 ? "rgba(53,208,127,0.85)" : "rgba(255,84,104,0.85)"));

    chartRef.current = new Chart(canvas, {
      plugins: [makeClippedDayPlugin(flowDays)],
      data: {
        labels: flowDays.map((d) => d.date),
        datasets: [
          {
            type: "bar",
            data: netFlow,
            backgroundColor: flowColors,
            borderWidth: 0,
            barPercentage: 1.0,
            categoryPercentage: 0.9,
            order: 2,
            clip: 4,
          },
          {
            type: "line",
            data: rollingAvg,
            borderColor: "#FF7A29",
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 34, bottom: 34 } },
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
                const raw = ctx.dataset.type === "line" ? (ctx.parsed.y as number) : netFlow[ctx.dataIndex];
                const name = ctx.dataset.type === "line" ? "7-day avg: " : "Net flow: ";
                return name + (raw >= 0 ? "+" : "") + formatNum(raw) + " RISE";
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 10 } } },
          y: {
            min: Y_MIN,
            max: Y_MAX,
            grid: { color: "rgba(255,255,255,0.04)" },
            ticks: { font: { size: 10 }, callback: (v) => (Number(v) / 1e6).toFixed(1) + "M" },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [flowDays]);

  return <canvas ref={canvasRef} />;
}
