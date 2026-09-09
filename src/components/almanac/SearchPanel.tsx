"use client";

import { useMemo, useState } from "react";
import { EpisodeRangeSlider } from "./EpisodeRangeSlider";
import { ResultCard } from "./ResultCard";
import { expandWord, searchLines } from "@/lib/almanac/search";
import type { Episode, FlatLine, Series } from "@/types/almanac";

const FILTERS: { key: Series | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "cafe_rise", label: "Cafe Rise" },
  { key: "origin_point", label: "Origin Point" },
  { key: "ama", label: "AMAs" },
];

const MAX_RESULTS = 60;

export function SearchPanel({ episodes, allLines, loading, statusText }: { episodes: Episode[]; allLines: FlatLine[]; loading: boolean; statusText: string }) {
  const [query, setQuery] = useState("");
  const [seriesFilter, setSeriesFilter] = useState<Series | "all">("all");
  const [range, setRange] = useState<{ min: number; max: number } | null>(null);

  const numberedRange = useMemo(() => {
    if (seriesFilter === "all" || seriesFilter === "ama") return null;
    const numbers = episodes.filter((e) => e.series === seriesFilter).map((e) => e.number ?? 0);
    if (numbers.length === 0) return null;
    return { min: Math.min(...numbers), max: Math.max(...numbers) };
  }, [episodes, seriesFilter]);

  const activeRange = numberedRange ? (range ?? numberedRange) : null;

  const { direct, related } = useMemo(
    () => searchLines(allLines, episodes, query, seriesFilter === "all" ? null : seriesFilter, activeRange),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeRange is derived fresh each render from numberedRange/range; including the object itself would re-run every render
    [allLines, episodes, query, seriesFilter, activeRange?.min, activeRange?.max],
  );

  const relatedTerms = query.trim() ? expandWord(query.trim().toLowerCase()) : [];
  const hasRelated = relatedTerms.length > 1;

  return (
    <div>
      <div className="mx-auto max-w-[900px] px-6 pt-3 pb-2 text-center font-ibm-plex-mono text-xs text-dim">{statusText}</div>
      <div className="sticky top-0 z-[5] border-y border-line bg-void/92 px-6 py-5 backdrop-blur-sm">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="search a word or phrase…"
          autoComplete="off"
          className="mx-auto block w-full max-w-[900px] rounded-sm border border-line bg-panel px-4 py-3.5 font-ibm-plex-mono text-[15px] text-ink outline-none placeholder:text-dim focus:border-gold"
        />
        <div className="mx-auto mt-3 flex max-w-[900px] flex-wrap justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setSeriesFilter(f.key);
                setRange(null);
              }}
              className={
                "rounded-[3px] border px-3.5 py-1.5 font-oswald text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors " +
                (seriesFilter === f.key ? "border-gold bg-gold text-void" : "border-line text-dim hover:border-gold-bright hover:text-gold-bright")
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        {numberedRange && (
          <EpisodeRangeSlider min={numberedRange.min} max={numberedRange.max} value={activeRange!} onChange={setRange} />
        )}
        <div className="mx-auto mt-2 max-w-[900px] text-center font-ibm-plex-mono text-xs text-dim">
          {loading ? "loading episodes…" : query.trim() ? `${direct.length} match${direct.length === 1 ? "" : "es"}` : ''}
        </div>
      </div>

      <main className="mx-auto max-w-[900px] px-6 pt-5">
        {!query.trim() ? (
          <div className="py-6 text-center font-ibm-plex-mono text-[13px] text-dim">
            Type a word or phrase above to search every episode transcript.
          </div>
        ) : direct.length === 0 && related.length === 0 ? (
          <div className="py-6 text-center font-ibm-plex-mono text-[13px] text-dim">No matches for &quot;{query}&quot;.</div>
        ) : (
          <>
            {direct.slice(0, MAX_RESULTS).map((line) => (
              <ResultCard key={`${line.epIndex}:${line.lineIndex}`} episode={episodes[line.epIndex]} line={line} query={query} relatedTerms={null} />
            ))}
            {hasRelated && related.length > 0 && (
              <>
                <div className="mt-5 mb-3 border-t border-dashed border-line pt-3 text-center font-ibm-plex-mono text-[11px] tracking-[0.2em] text-dim uppercase">
                  Related mentions
                </div>
                {related.slice(0, MAX_RESULTS).map((m) => (
                  <ResultCard
                    key={`related:${m.line.epIndex}:${m.line.lineIndex}`}
                    episode={episodes[m.line.epIndex]}
                    line={m.line}
                    query={query}
                    relatedTerms={relatedTerms}
                  />
                ))}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
