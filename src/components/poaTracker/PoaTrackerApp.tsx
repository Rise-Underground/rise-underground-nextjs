"use client";

import { useMemo, useRef, useState } from "react";
import { SiteNav } from "@/components/nav/SiteNav";
import { ScanlineOverlay } from "@/components/shared/ScanlineOverlay";
import { DisclaimerModal } from "@/components/shared/DisclaimerModal";
import { ItemCard } from "./ItemCard";
import { BundleCard } from "./BundleCard";
import { RecentMintsTicker } from "./RecentMintsTicker";
import { TopMintsHeader } from "./TopMintsHeader";
import { LastUpdatedText } from "./LastUpdatedText";
import { PoaSearchBox, type SearchTarget } from "./PoaSearchBox";
import { groupItems } from "@/lib/poaTracker/grouping";
import { slugifyForBundle } from "@/lib/poaTracker/format";
import type { PoaTrackerData } from "@/lib/data/poaTracker";

type Mode = "solo" | "bundles";

export function PoaTrackerApp({ items, bundleSummaries, recentMints, generatedAt, itemUrls, error }: PoaTrackerData) {
  const [mode, setMode] = useState<Mode>("solo");
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const highlightTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { soloItems, bundles } = useMemo(() => groupItems(items), [items]);

  const searchTargets = useMemo<SearchTarget[]>(() => {
    const bundleTargets = bundles.map((b) => ({ id: `bundle-${slugifyForBundle(b.name)}`, name: b.name, isBundle: true }));
    const soloTargets = soloItems.map((it) => ({ id: it.key, name: it.name, isBundle: false }));
    return [...bundleTargets, ...soloTargets];
  }, [bundles, soloItems]);

  function handleSelect(target: SearchTarget) {
    setMode(target.isBundle ? "bundles" : "solo");
    // wait a tick for the tab switch to mount its content before scrolling to it
    requestAnimationFrame(() => {
      const el = document.getElementById(target.id);
      if (!el) return;
      // "start" (not "center") so the card's own scroll-mt-* offset actually keeps it clear of the sticky header
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      if (highlightTimeout.current) clearTimeout(highlightTimeout.current);
      setHighlighted(target.id);
      highlightTimeout.current = setTimeout(() => setHighlighted(null), 1600);
    });
  }

  return (
    <div className="min-h-full bg-void text-ink">
      <ScanlineOverlay />
      <DisclaimerModal storageKey="riseDisclaimerDismissedAt" title="A Note On This Data">
        This tracker updates hourly and reflects our current understanding of how Infinity
        Rising&apos;s mint distribution and rarity system works. While we believe it to be accurate,
        gaps in our understanding or errors — either in how the team originally distributed rarity
        or in how this tracker calculates it — are possible. This tool is provided for informational
        purposes only, to give the community insight into the current state of open mints, and
        should not be considered financial advice.
      </DisclaimerModal>

      <SiteNav current="/poa-tracker" title="RISE POA Tracker" right={<LastUpdatedText generatedAt={generatedAt} />} />

      <div className="mx-auto max-w-[1400px] px-8 pt-7 pb-15">
        <h1 className="mb-7 text-center font-oswald text-[26px] font-bold tracking-[0.05em] text-ink uppercase">
          Mint Favorability Meter
        </h1>

        {error && (
          <div className="mb-6 rounded-lg border border-crimson bg-crimson/10 p-4 text-center font-ibm-plex-mono text-[13px] text-ink">
            Could not load NFT data ({error}).
          </div>
        )}

        {!error && items.length === 0 && (
          <div className="px-5 py-15 text-center font-ibm-plex-mono text-dim">
            <div className="mb-2 text-[15px] text-ink">No collection data yet</div>
            <div className="text-xs leading-relaxed text-dimmer">
              Nothing came back from the old site&apos;s NFT data files yet &mdash; check back shortly.
            </div>
          </div>
        )}

        {items.length > 0 && (
          <>
            <PoaSearchBox targets={searchTargets} onSelect={handleSelect} />
            <RecentMintsTicker mints={recentMints} />
            <TopMintsHeader items={items} />

            <div className="mb-4.5 flex gap-2">
              <button
                type="button"
                onClick={() => setMode("solo")}
                className={
                  "rounded-md border px-4.5 py-2 font-oswald text-xs font-semibold tracking-[0.1em] uppercase transition-colors " +
                  (mode === "solo" ? "border-gold bg-gold/10 text-ink" : "border-line text-dim hover:border-gold hover:text-gold-bright")
                }
              >
                Solo Items
              </button>
              <button
                type="button"
                onClick={() => setMode("bundles")}
                className={
                  "rounded-md border px-4.5 py-2 font-oswald text-xs font-semibold tracking-[0.1em] uppercase transition-colors " +
                  (mode === "bundles" ? "border-gold bg-gold/10 text-ink" : "border-line text-dim hover:border-gold hover:text-gold-bright")
                }
              >
                Bundles
              </button>
            </div>

            <div className={mode === "solo" ? "" : "hidden"}>
              {soloItems.map((item) => (
                <div
                  key={item.key}
                  className={highlighted === item.key ? "rounded-xl ring-2 ring-gold transition-shadow" : ""}
                >
                  <ItemCard item={item} storeUrl={itemUrls[item.key] ?? null} id={item.key} />
                </div>
              ))}
            </div>
            <div className={mode === "bundles" ? "" : "hidden"}>
              {bundles.map((b) => {
                const id = `bundle-${slugifyForBundle(b.name)}`;
                const primaryUrl = b.members.map((m) => itemUrls[m.key]).find(Boolean) ?? null;
                return (
                  <div key={b.name} className={highlighted === id ? "rounded-xl ring-2 ring-gold transition-shadow" : ""}>
                    <BundleCard bundleName={b.name} summary={bundleSummaries[b.name]} members={b.members} storeUrl={primaryUrl} />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <footer className="px-8 pt-6 pb-10 text-center font-ibm-plex-mono text-[11px] text-dimmer">
        <a href="https://x.com/RiseUGX" target="_blank" rel="noopener noreferrer" className="hover:text-gold">
          x.com/RiseUGX
        </a>
      </footer>
    </div>
  );
}
