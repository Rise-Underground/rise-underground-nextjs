import { GatewayImage } from "./GatewayImage";
import { NeedleGauge } from "./NeedleGauge";
import { DistributionGrid, OddsBreakdown } from "./ItemStats";
import { affiliateUrl, slugifyForBundle } from "@/lib/poaTracker/format";
import type { BundleSummary, NftItem } from "@/types/poaTracker";

/** One bundle: a summary gauge (combined across all members) + each member's own card. */
export function BundleCard({
  bundleName,
  summary,
  members,
  storeUrl,
}: {
  bundleName: string;
  summary: BundleSummary | undefined;
  members: NftItem[];
  storeUrl: string | null;
}) {
  const mintUrl = affiliateUrl(storeUrl);

  return (
    <div key={bundleName} id={`bundle-${slugifyForBundle(bundleName)}`} className="scroll-mt-20 md:scroll-mt-36">
      <div className="mb-2.5 rounded-[10px] border border-line bg-panel px-5 py-4.5 pb-5 text-center">
        <div className="mb-3 flex items-center justify-center gap-3">
          <span className="font-oswald text-[17px] font-semibold tracking-[0.03em] text-ink uppercase">{bundleName}</span>
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
        {summary && (
          <div className="mx-auto max-w-[220px]">
            <NeedleGauge needle={summary.needle} verdict={summary.verdict} combined />
          </div>
        )}
      </div>

      <div className="mb-11 rounded-xl border border-line p-2.5">
        {members.map((member) => (
          <div key={member.key} className="mb-1.5 rounded-[10px] border border-line bg-panel px-5 py-4.5 last:mb-0">
            <div className="grid grid-cols-1 items-center gap-5 min-[1300px]:grid-cols-[200px_1fr_1fr_1fr]">
              <div className="flex flex-col items-center justify-center">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-oswald text-[15px] font-semibold tracking-[0.02em] text-ink uppercase">{member.name}</span>
                </div>
                <GatewayImage
                  src={member.image}
                  alt="Highest-rarity mint so far"
                  className="aspect-square w-full max-w-[280px] rounded-lg border border-line bg-panel-2 object-cover"
                />
              </div>
              <div className="flex flex-col items-center">
                <div className="mb-2 text-center font-ibm-plex-mono text-[10.5px] tracking-[0.6px] text-dim uppercase">
                  Optimal Chain for Minting
                </div>
                <NeedleGauge needle={member.needle} verdict={member.verdict} />
              </div>
              <div>
                <DistributionGrid item={member} />
              </div>
              <div>
                <div className="mb-2 text-center font-ibm-plex-mono text-[10.5px] tracking-[0.6px] text-dim uppercase">Odds Breakdown</div>
                <OddsBreakdown item={member} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
