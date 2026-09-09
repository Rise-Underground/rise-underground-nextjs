/** Rank 1 = near-full ring, rank 10 = a sliver. */
export function RankGauge({ rank, size = 76 }: { rank: number; size?: number }) {
  const stroke = 7;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = (11 - rank) / 10;
  const offset = circumference * (1 - pct);
  const color = rank <= 3 ? "var(--color-crimson)" : "var(--color-gold)";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Rank ${rank}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-hairline)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="52%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-ink font-jetbrains-mono font-bold"
        style={{ fontSize: size * 0.29 }}
      >
        #{rank}
      </text>
    </svg>
  );
}
