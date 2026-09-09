import Papa from "papaparse";
import { fetchSourceFile, SOURCE_PATHS } from "./source";
import type { BoardCount, Placement } from "@/types/leaderboard";

interface PlacementRow {
  player?: string;
  board?: string;
  rank?: string | number;
  points?: string | number;
  raw_time?: string | number;
}

interface BoardRow {
  board?: string;
  placements_count?: string | number;
}

export interface LeaderboardData {
  placements: Placement[];
  boards: BoardCount[] | null;
  /** When ir_leaderboard_placements.csv was last actually modified (its real HTTP Last-Modified), not when we fetched it. */
  placementsLastModified: Date | null;
}

export async function fetchLeaderboardData(): Promise<LeaderboardData> {
  const [placementsResult, boardsResult] = await Promise.allSettled([
    fetchSourceFile(SOURCE_PATHS.leaderboardPlacements),
    fetchSourceFile(SOURCE_PATHS.leaderboardBoards),
  ]);

  if (placementsResult.status === "rejected") {
    return { placements: [], boards: null, placementsLastModified: null };
  }

  const { text: placementsText, lastModified } = placementsResult.value;
  const placements = parsePlacements(placementsText);
  const boards =
    boardsResult.status === "fulfilled" ? parseBoards(boardsResult.value.text) : null;

  return {
    placements,
    boards,
    placementsLastModified: lastModified ? new Date(lastModified) : null,
  };
}

function parsePlacements(csvText: string): Placement[] {
  const { data } = Papa.parse<PlacementRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  return data.map((row) => ({
    player: String(row.player ?? ""),
    board: String(row.board ?? ""),
    rank: parseInt(String(row.rank), 10),
    points: parseInt(String(row.points), 10) || 0,
    rawTime: row.raw_time !== undefined && row.raw_time !== "" ? parseFloat(String(row.raw_time)) : null,
  }));
}

function parseBoards(csvText: string): BoardCount[] {
  const { data } = Papa.parse<BoardRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  return data.map((row) => ({
    board: String(row.board ?? ""),
    count: parseInt(String(row.placements_count), 10) || 0,
  }));
}
