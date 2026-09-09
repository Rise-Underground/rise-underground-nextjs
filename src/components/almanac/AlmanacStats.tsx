import { computeAlmanacStats } from "@/lib/almanac/archiveText";
import type { ArchiveCategory } from "@/types/almanac";

/** Hero stat counts (Complete / In Progress / Partial / Pivoted), tallied from ready categories only. */
export function AlmanacStats({ categories }: { categories: ArchiveCategory[] }) {
  const counts = computeAlmanacStats(categories);

  return (
    <div className="mx-auto mb-11 max-w-[640px] px-6 text-center">
      <div className="mb-4 rounded-md border border-gold-bright bg-gradient-to-b from-gold/10 to-gold/[0.02] px-5 pt-7 pb-6 shadow-[0_0_30px_rgba(217,164,65,0.08)]">
        <div className="font-oswald text-[clamp(48px,9vw,84px)] leading-none font-extrabold text-gold-bright [text-shadow:0_0_24px_rgba(217,164,65,0.35)]">
          {counts.Complete}
        </div>
        <div className="mt-1.5 font-ibm-plex-mono text-[13px] tracking-[0.15em] text-ink uppercase">Completed &amp; Shipped</div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <div className="min-w-[120px] flex-1 rounded-[5px] border border-line bg-panel px-2.5 py-3.5">
          <div className="font-oswald text-[26px] font-bold text-ink">{counts.WIP}</div>
          <div className="mt-1 font-ibm-plex-mono text-[9.5px] tracking-[0.1em] text-dim uppercase">In Progress</div>
        </div>
        <div className="min-w-[120px] flex-1 rounded-[5px] border border-line bg-panel px-2.5 py-3.5">
          <div className="font-oswald text-[26px] font-bold text-ink">{counts["Partial Completion"]}</div>
          <div className="mt-1 font-ibm-plex-mono text-[9.5px] tracking-[0.1em] text-dim uppercase">Partially Complete</div>
        </div>
        <div className="min-w-[120px] flex-1 rounded-[5px] border border-line bg-panel px-2.5 py-3.5">
          <div className="font-oswald text-[26px] font-bold text-ink">{counts.Pivoted}</div>
          <div className="mt-1 font-ibm-plex-mono text-[9.5px] tracking-[0.1em] text-dim uppercase">Pivoted</div>
        </div>
      </div>
    </div>
  );
}
