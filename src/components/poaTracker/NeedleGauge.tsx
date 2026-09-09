import type { Needle, Verdict } from "@/types/poaTracker";

const ARC_LENGTH = 377; // matches the path's stroke-dasharray in the original SVG

function verdictText(verdict: Verdict, combined: boolean) {
  const suffix = combined ? " (combined)" : "";
  if (verdict.mode === "even") return "Roughly even right now";
  if (verdict.mode === "base")
    return (
      <>
        <span className="font-bold text-base-chain">Base</span> currently favors minting{suffix}
      </>
    );
  return (
    <>
      <span className="font-bold text-crimson">Cardano</span> currently favors minting{suffix}
    </>
  );
}

/** Arc + needle gauge showing which chain currently favors minting. */
export function NeedleGauge({ needle, verdict, combined = false }: { needle: Needle; verdict: Verdict; combined?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 190" className="w-full max-w-[250px]">
        <text x={20} y={24} textAnchor="start" className="fill-crimson font-ibm-plex-mono text-xs font-semibold tracking-[1px]">
          ADA
        </text>
        <text x={280} y={24} textAnchor="end" className="fill-base-chain font-ibm-plex-mono text-xs font-semibold tracking-[1px]">
          BASE
        </text>
        <path d="M 30 150 A 120 120 0 0 1 270 150" fill="none" stroke="var(--color-line)" strokeWidth={14} strokeLinecap="round" />
        <path
          d="M 30 150 A 120 120 0 0 1 270 150"
          fill="none"
          stroke="var(--color-dimmer)"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={ARC_LENGTH}
          strokeDashoffset={ARC_LENGTH - needle.arc_pct}
        />
        <line
          x1={150}
          y1={150}
          x2={150}
          y2={45}
          stroke="var(--color-ink)"
          strokeWidth={3}
          strokeLinecap="round"
          transform={`rotate(${needle.angle} 150 150)`}
        />
        <circle cx={150} cy={150} r={7} fill="var(--color-ink)" />
      </svg>
      <div className="mt-1.5 text-center font-ibm-plex-mono text-[13px] text-ink">{verdictText(verdict, combined)}</div>
    </div>
  );
}
