import {
  Chart,
  LineController,
  BarController,
  LineElement,
  BarElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

let registered = false;

/** Registers only the Chart.js pieces the 3 dashboard charts actually use. Call once, client-side only. */
export function ensureChartRegistered() {
  if (registered) return;
  Chart.register(LineController, BarController, LineElement, BarElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend);
  Chart.defaults.font.family = "'IBM Plex Mono', monospace";
  Chart.defaults.color = "#7c8494";
  registered = true;
}

export { Chart };
