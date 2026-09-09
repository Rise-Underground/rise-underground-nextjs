import type { NftItem, RarityTier } from "@/types/poaTracker";

const TIERS: RarityTier[] = ["Common", "Uncommon", "Rare", "Legendary", "Mythic"];
const TIER_COLOR: Record<RarityTier, string | null> = {
  Common: null,
  Uncommon: "#7ADE83",
  Rare: "#4EDFE7",
  Legendary: "#9633B3",
  Mythic: "#EB724D",
};

function GoldValue({ children }: { children: React.ReactNode }) {
  return <span className="font-bold text-[#f2c057] [text-shadow:0_0_8px_rgba(242,192,87,0.5)]">{children}</span>;
}

/** Rarity distribution (minted counts vs. expected), Base + Cardano side by side. */
export function DistributionGrid({ item }: { item: NftItem }) {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[10px] border border-line bg-line">
      {(["base", "cardano"] as const).map((chain) => {
        const dist = item.distribution[chain];
        const total = TIERS.reduce((s, t) => s + dist.counts[t], 0);
        return (
          <div key={chain} className="bg-panel px-5 py-4.5">
            <h3 className="mb-3 font-ibm-plex-mono text-[11px] tracking-[1px] text-dim uppercase">
              {chain === "base" ? "Base" : "Cardano"} — Minted NFT Distribution
            </h3>
            {TIERS.map((tier) => (
              <div key={tier} className="flex justify-between border-b border-line py-1 font-ibm-plex-mono text-xs last:border-b-0">
                <span style={TIER_COLOR[tier] ? { color: TIER_COLOR[tier]! } : undefined} className={TIER_COLOR[tier] ? "" : "text-dim"}>
                  {tier}
                </span>
                <span className="text-ink">
                  {dist.counts[tier]}{" "}
                  <span className="text-[10.5px] text-dimmer">(exp {Math.round((dist.odds[tier] || 0) * total)})</span>
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** Mythic / Legendary / Legendary-or-higher / Rare-or-higher odds, Base + Cardano side by side. */
export function OddsBreakdown({ item }: { item: NftItem }) {
  return (
    <div className="flex flex-col items-stretch divide-y divide-line">
      {(["base", "cardano"] as const).map((chain) => {
        const odds = item.odds_breakdown[chain];
        const mythic = odds.Mythic ?? 0;
        const legendary = odds.Legendary ?? 0;
        const rare = odds.Rare ?? 0;
        return (
          <div key={chain} className="px-5 py-4">
            <h3 className="mb-3 font-ibm-plex-mono text-[11px] tracking-[1px] text-dim uppercase">{chain === "base" ? "Base" : "Cardano"}</h3>
            <div className="flex justify-between border-b border-line py-1 font-ibm-plex-mono text-xs">
              <span style={{ color: "#EB724D" }}>Mythic</span>
              <GoldValue>{mythic.toFixed(1)}%</GoldValue>
            </div>
            <div className="flex justify-between border-b border-line py-1 font-ibm-plex-mono text-xs">
              <span style={{ color: "#9633B3" }}>Legendary</span>
              <GoldValue>{legendary.toFixed(1)}%</GoldValue>
            </div>
            <div className="flex justify-between border-b border-line py-1 font-ibm-plex-mono text-xs">
              <span style={{ color: "#9633B3" }}>Legendary or higher</span>
              <GoldValue>{(legendary + mythic).toFixed(1)}%</GoldValue>
            </div>
            <div className="flex justify-between py-1 font-ibm-plex-mono text-xs">
              <span style={{ color: "#4EDFE7" }}>Rare or higher</span>
              <GoldValue>{(rare + legendary + mythic).toFixed(1)}%</GoldValue>
            </div>
          </div>
        );
      })}
    </div>
  );
}
