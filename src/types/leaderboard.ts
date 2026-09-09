/** One row of ir_leaderboard_placements.csv: a single player's rank on a single board. */
export interface Placement {
  player: string;
  board: string;
  rank: number;
  points: number;
  rawTime: number | null;
}

/** One row of ir_leaderboard_boards.csv: a board's total placement count (used to spot open/thin boards). */
export interface BoardCount {
  board: string;
  count: number;
}

/** A player's aggregated standing across every board they've placed on. */
export interface Standing {
  name: string;
  points: number;
  placements: { board: string; rank: number }[];
}

export type OpportunityTier = "open" | "fewest" | "gap";

export interface Opportunity {
  board: string;
  detail: string;
}
