"use client";

import { useEffect, useState } from "react";
import { isCompetitionActive } from "@/lib/leaderboard/competitionWindow";
import { computeOpportunities } from "@/lib/leaderboard/standings";
import type { BoardCount, OpportunityTier, Placement } from "@/types/leaderboard";

const TIER_LABELS: Record<OpportunityTier, string> = {
  open: "Wide open boards",
  fewest: "Fewest racers",
  gap: "Easiest to crack top 10",
};

/** "Best places to score" panel -- only shown during an active competition window. */
export function OpportunitiesPanel({
  placements,
  boards,
}: {
  placements: Placement[];
  boards: BoardCount[] | null;
}) {
  const [active, setActive] = useState(() => isCompetitionActive(new Date()));

  useEffect(() => {
    const id = setInterval(() => setActive(isCompetitionActive(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  if (!active) return null;

  const { tier, items } = computeOpportunities(placements, boards);
  if (!tier || items.length === 0) return null;

  return (
    <div className="fixed top-5 left-5 z-30 hidden w-[260px] max-w-[42vw] rounded-md border border-hairline bg-gradient-to-b from-asphalt-2 to-asphalt-panel px-4 pt-4 pb-3 shadow-[0_12px_30px_rgba(0,0,0,0.4)] min-[701px]:block">
      <div className="mb-0.5 font-rajdhani text-[15px] font-bold uppercase tracking-[0.06em] text-gold">
        Best Places to Score
      </div>
      <div className="mb-2.5 font-jetbrains-mono text-[10.5px] tracking-[0.04em] text-steel">
        {TIER_LABELS[tier]}
      </div>
      {items.map((item, i) => (
        <div key={item.board} className="grid grid-cols-[18px_1fr] grid-rows-2 gap-x-2 border-t border-hairline py-1.5 first:border-t-0">
          <div className="row-span-2 font-jetbrains-mono text-[13px] font-bold text-crimson">{i + 1}</div>
          <div className="font-rajdhani text-[13px] font-semibold leading-tight text-ink">{item.board}</div>
          <div className="font-jetbrains-mono text-[10.5px] text-steel">{item.detail}</div>
        </div>
      ))}
    </div>
  );
}
