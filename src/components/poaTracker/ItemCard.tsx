import { GatewayImage } from "./GatewayImage";
import { NeedleGauge } from "./NeedleGauge";
import { DistributionGrid, OddsBreakdown } from "./ItemStats";
import { affiliateUrl } from "@/lib/poaTracker/format";
import type { NftItem } from "@/types/poaTracker";

function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[10px] border border-line bg-panel">
      {title && (
        <div className="flex justify-center border-b border-line px-[22px] py-4.5">
          <h2 className="font-ibm-plex-mono text-[13px] font-semibold tracking-[0.5px] text-ink uppercase">{title}</h2>
        </div>
      )}
      <div className="flex flex-1 flex-col items-center justify-center p-4.5">{children}</div>
    </div>
  );
}

/** One solo-sale item card: title/mint-now, image, chain gauge, distribution, odds breakdown. */
export function ItemCard({ item, storeUrl, id }: { item: NftItem; storeUrl: string | null; id?: string }) {
  const mintUrl = affiliateUrl(storeUrl);

  return (
    <div id={id} className="mb-11 scroll-mt-20 md:scroll-mt-36">
      <div className="mb-3 flex items-center justify-center gap-2.5">
        <span className="font-oswald text-lg font-semibold tracking-[0.03em] text-ink uppercase">{item.name}</span>
        {mintUrl && (
          <a
            href={mintUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-[#3ECF6E] px-3 py-1 font-ibm-plex-mono text-[11.5px] font-bold whitespace-nowrap text-[#08130c] shadow-[0_0_10px_rgba(62,207,110,0.35)] hover:bg-[#57DB80]"
          >
            Mint Now
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 min-[1500px]:grid-cols-4">
        <Panel>
          <GatewayImage
            src={item.image}
            alt="Highest-rarity mint so far"
            className="aspect-square w-full max-w-[280px] rounded-lg border border-line bg-panel-2 object-cover"
          />
        </Panel>
        <Panel title="Optimal Chain for Minting">
          <NeedleGauge needle={item.needle} verdict={item.verdict} />
        </Panel>
        <DistributionGrid item={item} />
        <Panel title="Odds Breakdown">
          <div className="w-full">
            <OddsBreakdown item={item} />
          </div>
        </Panel>
      </div>
    </div>
  );
}
