import type { Episode, FlatLine } from "@/types/almanac";

// Project-specific "related terms" groups, built from actual word co-occurrence in the Cafe Rise
// transcripts (not generic synonyms). A search for any word in a group also matches other words in
// that same group, surfaced separately as "related" results.
export const SYNONYM_GROUPS: string[][] = [
  ["cornucopias", "cornucopia", "cornuc", "cornic", "corn copius", "corner copiu", "corny copius", "corn and copious"],
  ["copi", "kopi", "copy"],
  ["staking", "stake", "stakers", "node", "nodes", "reward", "rewards", "pool", "pools"],
  ["land", "plot", "plots", "dome", "domes", "apartment", "apartments", "property", "islands", "solace", "realm"],
  ["nft", "nfts", "cnft", "mint", "minting", "minted", "rarity", "rarities", "holder", "holders", "bundle", "bundles", "marketplace"],
  ["cardano", "base", "ethereum", "bnb", "bridge", "bridging", "chainport", "migration", "migrate", "swap"],
  ["token", "tokens", "tokenomics", "tokconomics", "utility", "supply", "economy", "distribution", "allocation", "listing", "exchange"],
  ["racing", "race", "vehicle", "vehicles", "car", "cars", "track", "tracks", "jet", "jetpack", "drone"],
  ["engine", "unreal", "graphics", "alpha", "beta", "testnet", "mainnet", "launch", "launcher", "metaverse"],
  ["community", "discord", "team", "partnership", "partners"],
];

const SYNONYM_LOOKUP: Record<string, string[]> = {};
SYNONYM_GROUPS.forEach((group) => group.forEach((word) => (SYNONYM_LOOKUP[word] = group)));

export function expandWord(word: string): string[] {
  return SYNONYM_LOOKUP[word] || [word];
}

export function fmtTime(sec: number): string {
  sec = Math.floor(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

export interface TextSegment {
  text: string;
  match: boolean;
}

/** Splits `text` around the first case-insensitive occurrence of `query`, for <mark>-style rendering. */
export function highlight(text: string, query: string): TextSegment[] {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return [{ text, match: false }];
  return [
    { text: text.slice(0, idx), match: false },
    { text: text.slice(idx, idx + query.length), match: true },
    { text: text.slice(idx + query.length), match: false },
  ].filter((s) => s.text !== "");
}

/** Same as highlight, but for "related" results where the literal query may not appear -- highlights whichever synonym term actually matched. */
export function highlightAny(text: string, terms: string[]): TextSegment[] {
  const lower = text.toLowerCase();
  let bestIdx = -1;
  let bestTerm = "";
  terms.forEach((term) => {
    const idx = lower.indexOf(term);
    if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
      bestIdx = idx;
      bestTerm = term;
    }
  });
  if (bestIdx === -1) return [{ text, match: false }];
  return [
    { text: text.slice(0, bestIdx), match: false },
    { text: text.slice(bestIdx, bestIdx + bestTerm.length), match: true },
    { text: text.slice(bestIdx + bestTerm.length), match: false },
  ].filter((s) => s.text !== "");
}

export interface SearchMatch {
  line: FlatLine;
  related: boolean;
}

/**
 * Direct query matches plus, separately, "related" matches via the synonym groups (excluding
 * anything already a direct match), scoped to the active series filter and episode range.
 */
export function searchLines(
  allLines: FlatLine[],
  episodes: Episode[],
  query: string,
  seriesFilter: string | null,
  episodeRange: { min: number; max: number } | null,
): { direct: FlatLine[]; related: SearchMatch[] } {
  const q = query.trim().toLowerCase();
  if (!q) return { direct: [], related: [] };

  function passesFilters(line: FlatLine): boolean {
    const ep = episodes[line.epIndex];
    if (!ep) return false;
    if (seriesFilter && ep.series !== seriesFilter) return false;
    if (episodeRange && ep.number != null && (ep.number < episodeRange.min || ep.number > episodeRange.max)) return false;
    return true;
  }

  const direct: FlatLine[] = [];
  const directKeys = new Set<string>();
  for (const line of allLines) {
    if (!passesFilters(line)) continue;
    if (line.text.toLowerCase().includes(q)) {
      direct.push(line);
      directKeys.add(`${line.epIndex}:${line.lineIndex}`);
    }
  }

  const terms = expandWord(q);
  const related: SearchMatch[] = [];
  if (terms.length > 1) {
    for (const line of allLines) {
      if (!passesFilters(line)) continue;
      const key = `${line.epIndex}:${line.lineIndex}`;
      if (directKeys.has(key)) continue;
      const lower = line.text.toLowerCase();
      if (terms.some((t) => lower.includes(t))) related.push({ line, related: true });
    }
  }

  return { direct, related };
}
