"use client";

import { useMemo, useState } from "react";
import { SiteNav } from "@/components/nav/SiteNav";
import { ScanlineOverlay } from "@/components/shared/ScanlineOverlay";
import { SearchBox } from "./SearchBox";
import { BoardDrawer, type DrawerRacer } from "./BoardDrawer";
import { CountdownClock } from "./CountdownClock";
import { OpportunitiesPanel } from "./OpportunitiesPanel";
import { LastUpdatedClock } from "./LastUpdatedClock";
import { buildStandings } from "@/lib/leaderboard/standings";
import type { BoardCount, Placement } from "@/types/leaderboard";

const MEDAL_STYLES: Record<number, string> = {
  1: "border-l-[6px] border-l-gold-bright bg-gradient-to-r from-gold-bright/[0.22] to-gold-bright/[0.03] shadow-[inset_0_0_0_1px_rgba(212,165,55,0.15)] hover:from-gold-bright/30",
  2: "border-l-[6px] border-l-silver bg-gradient-to-r from-silver/[0.18] to-silver/[0.02] shadow-[inset_0_0_0_1px_rgba(201,204,209,0.12)] hover:from-silver/25",
  3: "border-l-[6px] border-l-bronze bg-gradient-to-r from-bronze/20 to-bronze/[0.03] shadow-[inset_0_0_0_1px_rgba(205,127,50,0.14)] hover:from-bronze/[0.28]",
};

const RANK_COLOR: Record<number, string> = { 1: "text-gold-bright", 2: "text-silver", 3: "text-bronze" };

function seasonLabel(now: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(now)
    .toUpperCase();
}

export function LeaderboardApp({
  placements,
  boards,
  placementsLastModified,
}: {
  placements: Placement[];
  boards: BoardCount[] | null;
  placementsLastModified: Date | null;
}) {
  const [drawer, setDrawer] = useState<DrawerRacer | null>(null);

  const standings = useMemo(() => buildStandings(placements), [placements]);
  const top10 = standings.slice(0, 10);

  return (
    <>
      <ScanlineOverlay />
      <SiteNav
        current="/leaderboard"
        right={
          <div className="rounded-[3px] border border-line px-2.5 py-1.5 font-jetbrains-mono text-xs tracking-[0.04em] text-dim">
            {seasonLabel(new Date())}
          </div>
        }
      />
      <div className="relative mx-auto max-w-[880px] px-6 pb-24">
        <OpportunitiesPanel placements={placements} boards={boards} />
        <LastUpdatedClock lastModified={placementsLastModified} />

        <section className="relative overflow-hidden pt-10 pb-10">
          <p className="mb-3.5 font-rajdhani text-[13px] font-semibold tracking-[0.2em] text-crimson uppercase">
            Rise Underground presents
          </p>
          <h1 className="font-rajdhani text-[clamp(42px,8vw,76px)] leading-[0.96] font-bold tracking-[-0.01em] text-ink uppercase">
            Leaders
            <span className="block text-steel">of the Leaderboards</span>
          </h1>
          <p className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-steel">
            Points stack across every tracked leaderboard — every Calido Valley Raceway track/vehicle
            combo, every Aero Trails course, and Holocache.
          </p>
          <CountdownClock />
        </section>

        <div className="mb-3.5 mt-2 flex items-baseline justify-between gap-3">
          <h2 className="font-rajdhani text-xl tracking-[0.08em] text-ink uppercase">Top 10</h2>
          <SearchBox standings={standings} onSelect={(rank, racer) => setDrawer({ rank, racer })} />
        </div>

        <div className="overflow-hidden rounded-[3px] border border-hairline bg-gradient-to-b from-asphalt-2 to-asphalt-panel">
          {top10.length === 0 ? (
            <div className="px-6 py-12 text-center font-jetbrains-mono text-[13px] text-steel">
              No standings loaded yet.
            </div>
          ) : (
            top10.map((racer, i) => {
              const rank = i + 1;
              return (
                <button
                  key={racer.name}
                  type="button"
                  onClick={() => setDrawer({ rank, racer })}
                  className={
                    "grid w-full grid-cols-[52px_1fr_auto_20px] items-center gap-3.5 border-t border-hairline px-4.5 py-4 text-left transition-colors first:border-t-0 hover:bg-crimson/[0.06] " +
                    (MEDAL_STYLES[rank] ?? "")
                  }
                >
                  <div className={"font-jetbrains-mono text-xl font-bold " + (RANK_COLOR[rank] ?? "text-steel")}>
                    {String(rank).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="font-rajdhani text-lg font-semibold tracking-[0.02em] text-ink underline decoration-transparent underline-offset-[3px] transition-colors">
                      {racer.name}
                    </div>
                    <div className="mt-0.5 font-jetbrains-mono text-[11px] text-steel">
                      Placed on {racer.placements.length} board{racer.placements.length === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="text-right font-jetbrains-mono">
                    <div className="text-xl font-bold text-ink">{racer.points}</div>
                    <div className="text-[10px] tracking-[0.08em] text-steel">PTS</div>
                  </div>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-steel">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              );
            })
          )}
        </div>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-2.5 border-t border-hairline pt-5 font-jetbrains-mono text-[11px] text-dimmer">
          <a
            href="https://x.com/RiseUGX"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="RISE Underground on X"
            className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-hairline text-dimmer transition-colors hover:border-gold hover:bg-gold/10 hover:text-gold"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <span>RISE UNDERGROUND · RISEUGX</span>
        </footer>

        <BoardDrawer open={drawer} onClose={() => setDrawer(null)} />
      </div>
    </>
  );
}
