"use client";

import { useEffect, useState } from "react";
import { getCompetitionPhase, isEndedBannerVisible } from "@/lib/leaderboard/competitionWindow";

function formatClock(target: Date, now: Date) {
  const totalSeconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return { days, hours: pad(hours), minutes: pad(minutes), seconds: pad(seconds) };
}

/** The countdown strip (starts-in / ends-in) and the "competition ended" banner. Ticks every second. */
export function CountdownClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const phase = getCompetitionPhase(now);
  const endedBannerVisible = isEndedBannerVisible(now);

  if (endedBannerVisible) {
    return (
      <div className="mt-[30px] rounded-[3px] border border-gold bg-gradient-to-b from-gold/10 to-gold/[0.03] px-5 py-4 font-rajdhani text-[clamp(14px,2vw,16px)] font-semibold text-ink">
        🏆 Congrats to the winners! Practice and get ready for next month&apos;s Leader of the Leaderboards.
      </div>
    );
  }

  if (phase.phase === "dormant") return null;

  const clock = formatClock(phase.target, now);
  const label = phase.phase === "starts-in" ? "COMPETITION STARTS IN" : "COMPETITION ENDS IN";

  return (
    <div className="mt-[30px] border-t border-dashed border-hairline pt-[22px]">
      <div className="mb-2.5 animate-pulse font-rajdhani text-[clamp(15px,2.2vw,20px)] font-bold uppercase tracking-[0.16em] text-crimson">
        {label}
      </div>
      <div
        suppressHydrationWarning
        className="font-jetbrains-mono text-[clamp(40px,8vw,68px)] font-bold tracking-[0.02em] text-gold [text-shadow:0_0_24px_rgba(212,165,55,0.35)]"
      >
        {clock.days}
        <span className="mr-[22px] text-base font-medium tracking-[0.04em] text-steel">D</span>
        {clock.hours}
        <span className="mr-[22px] text-base font-medium tracking-[0.04em] text-steel">H</span>
        {clock.minutes}
        <span className="mr-[22px] text-base font-medium tracking-[0.04em] text-steel">M</span>
        {clock.seconds}
        <span className="text-base font-medium tracking-[0.04em] text-steel">S</span>
      </div>
    </div>
  );
}
