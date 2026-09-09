"use client";

import { useEffect, useState } from "react";
import { isCompetitionActive } from "@/lib/leaderboard/competitionWindow";

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * How long since ir_leaderboard_placements.csv actually changed (its real HTTP
 * Last-Modified time), not since this page last fetched it. Only shown during an
 * active competition.
 */
export function LastUpdatedClock({ lastModified }: { lastModified: Date | null }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!lastModified || !isCompetitionActive(now)) return null;

  return (
    <div className="fixed top-5 right-5 z-30 hidden w-[220px] max-w-[42vw] rounded-md border border-hairline bg-gradient-to-b from-asphalt-2 to-asphalt-panel p-4 text-center shadow-[0_12px_30px_rgba(0,0,0,0.4)] min-[701px]:block">
      <div className="mb-2 font-rajdhani text-[15px] font-bold uppercase tracking-[0.06em] text-gold">
        Last Updated
      </div>
      <div suppressHydrationWarning className="font-jetbrains-mono text-xl font-bold text-ink">
        {formatElapsed(now.getTime() - lastModified.getTime())}
      </div>
      <div className="mt-1 font-jetbrains-mono text-[10.5px] tracking-[0.04em] text-steel">
        as of {lastModified.toUTCString().replace(" GMT", " UTC")}
      </div>
    </div>
  );
}
