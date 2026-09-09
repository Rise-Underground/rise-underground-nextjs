// Every data-driven page reads straight from the live old site -- its own
// scraping pipeline keeps running there, hourly, untouched, committing
// updated CSV/JSON that GitHub Pages then serves. See .claude/CODING-STANDARDS.md for why.
//
// Deliberately NOT raw.githubusercontent.com: that host sends no
// Last-Modified header at all, which the leaderboard's "last updated" clock
// depends on (GitHub Pages sets it from the file's actual commit time, same
// as the original page relied on). This runs server-side, so CORS doesn't
// apply here either way.
export const OLD_SITE_BASE = "https://rise-underground.github.io";

const REVALIDATE_SECONDS = 300;

/**
 * Every fixed filename/folder this app reads from the old repo, in one place. If the old site's
 * data pipeline ever renames a file, or this project merges with the old one, this is the only
 * file that needs to change -- nowhere else should hardcode one of these strings.
 */
export const SOURCE_PATHS = {
  leaderboardPlacements: "ir_leaderboard_placements.csv",
  leaderboardBoards: "ir_leaderboard_boards.csv",
  dashboardData: "combined_dashboard_data.json",
  poolSummary: "pool_summary.json",
  nftAssetsDir: "NFT_Data",
  nftData: "NFT_Data/nft_data.json",
  nftMintStatus: "NFT_Data/nft_mint_status.csv",
  transcriptsDir: "transcripts",
  transcriptSeries: {
    cafeRise: "Cafe_Rise",
    originPoint: "Origin Point",
    amas: "AMAs",
  },
} as const;

export class SourceFileError extends Error {
  constructor(
    public readonly path: string,
    public readonly status: number,
  ) {
    super(`Failed to fetch ${path} from the old repo (HTTP ${status})`);
    this.name = "SourceFileError";
  }
}

/** Fetches a file from the old repo, returning both its text and the response headers. */
export async function fetchSourceFile(path: string): Promise<{ text: string; lastModified: string | null }> {
  const res = await fetch(`${OLD_SITE_BASE}/${path}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new SourceFileError(path, res.status);
  const text = await res.text();
  return { text, lastModified: res.headers.get("last-modified") };
}

/**
 * Absolute URL to a static asset (image, etc.) on the old site -- for things like NFT mint images
 * that aren't worth mirroring into this repo. Used directly in <img> src, browser-side.
 */
export function oldSiteAssetUrl(path: string): string {
  return `${OLD_SITE_BASE}/${path}`;
}
