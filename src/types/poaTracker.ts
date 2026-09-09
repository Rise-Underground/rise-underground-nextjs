export type RarityTier = "Common" | "Uncommon" | "Rare" | "Legendary" | "Mythic";

export interface RarityDistribution {
  counts: Record<RarityTier, number>;
  odds: Record<RarityTier, number>;
}

export interface Needle {
  score: number;
  angle: number;
  arc_pct: number;
}

export interface Verdict {
  mode: "even" | "base" | "cardano";
  strength: "even" | "slight" | "moderate" | "strong";
}

export interface NftItem {
  key: string;
  name: string;
  bundle: string | null;
  bundle_exclusive: boolean;
  solo_sale: boolean;
  image: string | null;
  latest_mint_time: string | null;
  needle: Needle;
  verdict: Verdict;
  best_mythic: { chain: string; pct: number } | null;
  odds_breakdown: {
    base: Partial<Record<RarityTier, number>>;
    cardano: Partial<Record<RarityTier, number>>;
  };
  distribution: {
    base: RarityDistribution;
    cardano: RarityDistribution;
  };
}

export interface BundleSummary {
  name: string;
  needle: Needle;
  verdict: Verdict;
}

export interface RecentMint {
  name: string;
  image: string | null;
  rarity: RarityTier;
  chain: "cardano" | "base";
  time: string;
}

export interface NftData {
  generated_at: string | null;
  items: NftItem[];
  bundle_summaries: BundleSummary[];
  recent_mints: RecentMint[];
}

export interface MintStatusRow {
  key: string;
  url: string | null;
  open: boolean;
}
