import { formatCompact, formatSigned } from "@/lib/riseTracker/format";

/** A signed net-flow number, colored green when positive and red when negative. */
export function SignedFlow({
  value,
  formatter = formatCompact,
}: {
  value: number;
  formatter?: (n: number) => string;
}) {
  const color = value > 0 ? "text-tracker-green" : value < 0 ? "text-tracker-red" : undefined;
  return <span className={color}>{formatSigned(value, formatter)}</span>;
}
