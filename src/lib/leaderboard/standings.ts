import type { BoardCount, Opportunity, OpportunityTier, Placement, Standing } from "@/types/leaderboard";

/** Sums points per player across every board placement, sorted highest first. */
export function buildStandings(placements: Placement[]): Standing[] {
  const byPlayer = new Map<string, Standing>();
  for (const p of placements) {
    let entry = byPlayer.get(p.player);
    if (!entry) {
      entry = { name: p.player, points: 0, placements: [] };
      byPlayer.set(p.player, entry);
    }
    entry.points += p.points;
    entry.placements.push({ board: p.board, rank: p.rank });
  }
  const standings = Array.from(byPlayer.values());
  standings.forEach((s) => s.placements.sort((a, b) => a.rank - b.rank));
  standings.sort((a, b) => b.points - a.points);
  return standings;
}

/**
 * "Best places to score" priority cascade, evaluated globally across all boards:
 *   1. Any board with 0 placements -- wide open, easiest possible entry.
 *   2. Else, boards with the fewest placements -- easiest to crack the top 10.
 *   3. Else (every board full), boards with the largest % time gap between 1st and 10th place --
 *      a weak 10th place is easy to leapfrog.
 */
export function computeOpportunities(
  placements: Placement[],
  boards: BoardCount[] | null,
): { tier: OpportunityTier | null; items: Opportunity[] } {
  let boardCounts: BoardCount[];
  if (boards) {
    boardCounts = boards;
  } else {
    const rankSets = new Map<string, Set<number>>();
    placements.forEach((p) => {
      if (!rankSets.has(p.board)) rankSets.set(p.board, new Set());
      rankSets.get(p.board)!.add(p.rank);
    });
    boardCounts = Array.from(rankSets.entries()).map(([board, ranks]) => ({ board, count: ranks.size }));
  }

  if (boardCounts.length === 0) return { tier: null, items: [] };

  const zeroBoards = boardCounts.filter((b) => b.count === 0);
  if (zeroBoards.length > 0) {
    return {
      tier: "open",
      items: zeroBoards.slice(0, 5).map((b) => ({ board: b.board, detail: "Open — be first!" })),
    };
  }

  const allFull = boardCounts.every((b) => b.count >= 10);
  if (!allFull) {
    const sorted = [...boardCounts].sort((a, b) => a.count - b.count);
    return {
      tier: "fewest",
      items: sorted
        .slice(0, 5)
        .map((b) => ({ board: b.board, detail: `${b.count} racer${b.count === 1 ? "" : "s"}` })),
    };
  }

  const byBoard = new Map<string, { first?: number; tenth?: number }>();
  placements.forEach((p) => {
    if (p.rank !== 1 && p.rank !== 10) return;
    if (!byBoard.has(p.board)) byBoard.set(p.board, {});
    const entry = byBoard.get(p.board)!;
    if (p.rank === 1) entry.first = p.rawTime ?? undefined;
    else entry.tenth = p.rawTime ?? undefined;
  });

  const gaps: { board: string; gapPct: number }[] = [];
  byBoard.forEach((times, board) => {
    if (times.first != null && times.tenth != null && times.first > 0) {
      gaps.push({ board, gapPct: ((times.tenth - times.first) / times.first) * 100 });
    }
  });
  gaps.sort((a, b) => b.gapPct - a.gapPct);
  return {
    tier: "gap",
    items: gaps.slice(0, 5).map((g) => ({ board: g.board, detail: `${g.gapPct.toFixed(1)}% gap` })),
  };
}

/**
 * Deep link to the matching leaderboard tab on infinityrising.com, scoped to the Weekly
 * timeframe. The address bar doesn't change per course/track/vehicle filter (those are
 * client-side only there), so this links to the right category page at the Weekly view,
 * not the exact filtered board.
 */
export function boardUrl(boardName: string): string | null {
  if (boardName.startsWith("Aero Trails")) {
    return "https://infinityrising.com/leaderboards/aero-trails?timeframe=Weekly";
  }
  if (boardName.startsWith("Calido")) {
    return "https://infinityrising.com/leaderboards/calido-valley-raceway?timeframe=Weekly";
  }
  if (boardName === "Holocache") {
    return "https://infinityrising.com/leaderboards/holocache?timeframe=Weekly";
  }
  return null;
}
