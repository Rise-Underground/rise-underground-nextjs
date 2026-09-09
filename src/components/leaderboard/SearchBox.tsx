"use client";

import { useMemo, useRef, useState } from "react";
import type { Standing } from "@/types/leaderboard";

export function SearchBox({
  standings,
  onSelect,
}: {
  standings: Standing[];
  onSelect: (rank: number, racer: Standing) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return standings
      .map((s, i) => ({ ...s, rank: i + 1 }))
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, standings]);

  function pick(match: Standing & { rank: number }) {
    onSelect(match.rank, match);
    setOpen(false);
    setQuery("");
  }

  return (
    <div
      ref={wrapRef}
      className="relative w-[220px] max-w-[46vw] sm:w-[220px]"
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <input
        type="text"
        value={query}
        autoComplete="off"
        aria-label="Search competitors by name"
        placeholder="Find a competitor…"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => query && setOpen(true)}
        className="w-full rounded-[3px] border border-hairline bg-asphalt-panel px-2.5 py-2 font-jetbrains-mono text-[12.5px] text-ink outline-none placeholder:text-steel focus:border-gold"
      />
      {open && query.trim() && (
        <div className="absolute top-[calc(100%+6px)] right-0 z-[35] max-h-[260px] w-[260px] max-w-[70vw] overflow-y-auto rounded-[3px] border border-hairline bg-gradient-to-b from-asphalt-2 to-asphalt-panel shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
          {matches.length === 0 ? (
            <div className="p-3 font-jetbrains-mono text-[11.5px] text-steel">
              No racer matches &quot;{query}&quot;
            </div>
          ) : (
            matches.map((m) => (
              <button
                key={m.name}
                type="button"
                onClick={() => pick(m)}
                className="flex w-full items-center gap-2.5 border-t border-hairline px-3 py-2.5 text-left first:border-t-0 hover:bg-crimson/10"
              >
                <span className="min-w-[26px] font-jetbrains-mono text-[11px] text-steel">#{m.rank}</span>
                <span className="flex-1 font-rajdhani text-sm font-semibold text-ink">{m.name}</span>
                <span className="font-jetbrains-mono text-[11px] text-gold">{m.points} PTS</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
