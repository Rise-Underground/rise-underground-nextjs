"use client";

import { useEffect } from "react";
import { RankGauge } from "./RankGauge";
import { boardUrl } from "@/lib/leaderboard/standings";
import type { Standing } from "@/types/leaderboard";

export interface DrawerRacer {
  racer: Standing;
  rank: number;
}

export function BoardDrawer({ open, onClose }: { open: DrawerRacer | null; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <>
      <div
        className={
          "fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="Board placements"
        aria-hidden={!open}
        className={
          "fixed top-1/2 left-1/2 z-50 max-h-[82vh] w-[480px] max-w-[90vw] -translate-x-1/2 overflow-y-auto rounded-md border border-hairline bg-gradient-to-b from-asphalt-2 to-asphalt-panel px-[26px] pt-7 pb-9 shadow-[0_30px_80px_rgba(0,0,0,0.6)] transition-all duration-200 " +
          (open ? "-translate-y-1/2 scale-100 opacity-100" : "-translate-y-1/2 scale-95 opacity-0 pointer-events-none")
        }
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 h-8 w-8 rounded-[3px] border border-hairline font-jetbrains-mono text-base leading-none text-steel hover:border-crimson hover:text-ink"
        >
          &times;
        </button>
        {open && (
          <>
            <div className="mb-6 pr-11">
              <div className="font-jetbrains-mono text-[13px] tracking-[0.08em] text-steel">
                RANK #{open.rank}
              </div>
              <div className="my-1 font-rajdhani text-[32px] leading-[1.05] font-bold uppercase text-ink">
                {open.racer.name}
              </div>
              <div className="font-jetbrains-mono text-sm text-gold">{open.racer.points} PTS TOTAL</div>
            </div>
            <p className="mb-4 border-t border-dashed border-hairline pt-4 font-jetbrains-mono text-[11px] tracking-[0.1em] uppercase text-steel">
              {open.racer.placements.length} board{open.racer.placements.length === 1 ? "" : "s"}
            </p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-x-3 gap-y-5">
              {open.racer.placements.map((p) => {
                const href = boardUrl(p.board);
                const content = (
                  <>
                    <RankGauge rank={p.rank} size={88} />
                    <div className="board-name text-center font-rajdhani text-[12.5px] leading-tight text-steel uppercase tracking-[0.04em] transition-colors">
                      {p.board}
                    </div>
                  </>
                );
                const className = "flex flex-col items-center gap-2 rounded-[3px] transition-transform hover:-translate-y-0.5 [&:hover_.board-name]:text-gold";
                return href ? (
                  <a
                    key={p.board}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${p.board} leaderboard`}
                    className={className}
                  >
                    {content}
                  </a>
                ) : (
                  <div key={p.board} className={className}>
                    {content}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
