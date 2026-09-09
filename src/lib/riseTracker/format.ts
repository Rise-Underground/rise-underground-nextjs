export function formatNum(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function formatCompact(n: number): string {
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.round(n).toString();
}

export function formatSigned(n: number, formatter: (n: number) => string = formatCompact): string {
  return (n >= 0 ? "+" : "") + formatter(n);
}
