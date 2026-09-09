"use client";

import { SiteNav } from "@/components/nav/SiteNav";
import { ScanlineOverlay } from "@/components/shared/ScanlineOverlay";
import { AlmanacStats } from "./AlmanacStats";
import { SearchPanel } from "./SearchPanel";
import { FeatureArchive } from "./FeatureArchive";
import { useAlmanacTranscripts } from "@/lib/almanac/useAlmanacTranscripts";
import archiveData from "@/data/almanac-archive.json";
import type { ArchiveCategory } from "@/types/almanac";

const categories = archiveData as unknown as ArchiveCategory[];

export function AlmanacApp() {
  const { episodes, allLines, counts, loading } = useAlmanacTranscripts();

  const found = counts.cafe_rise + counts.origin_point + counts.ama;
  const statusText = loading
    ? "loading episodes…"
    : found > 0
      ? `${found} episode${found === 1 ? "" : "s"} loaded (${counts.cafe_rise} Cafe Rise, ${counts.origin_point} Origin Point, ${counts.ama} AMA) — ${allLines.length} lines indexed`
      : "no episodes found";

  return (
    <div className="relative min-h-full bg-void text-ink">
      <ScanlineOverlay />
      <SiteNav current="/almanac" />

      <header className="relative z-[2] px-6 pt-9 pb-4.5 text-center">
        <div className="mb-2.5 font-ibm-plex-mono text-[11px] tracking-[0.35em] text-crimson uppercase">Rise Underground</div>
        <h1 className="m-0 font-oswald text-[clamp(30px,5vw,46px)] font-bold tracking-[0.04em] text-ink uppercase">
          Infinity Rising <span className="text-gold">Almanac</span>
        </h1>
      </header>

      <AlmanacStats categories={categories} />

      <SearchPanel episodes={episodes} allLines={allLines} loading={loading} statusText={statusText} />

      <FeatureArchive categories={categories} />

      <footer className="px-6 pt-2 pb-10 text-center font-ibm-plex-mono text-[11px] text-dimmer">
        <a href="https://x.com/RiseUGX" target="_blank" rel="noopener noreferrer" className="hover:text-gold">
          x.com/RiseUGX
        </a>
      </footer>
    </div>
  );
}
