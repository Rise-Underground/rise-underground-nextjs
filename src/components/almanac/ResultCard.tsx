"use client";

import { useState } from "react";
import { fmtTime, highlight, highlightAny } from "@/lib/almanac/search";
import type { Episode, FlatLine } from "@/types/almanac";

const SERIES_LABEL: Record<string, string> = { cafe_rise: "Cafe Rise", origin_point: "Origin Point", ama: "AMAs" };
const CONTEXT_STEP = 6;

function Highlighted({ segments }: { segments: { text: string; match: boolean }[] }) {
  return (
    <>
      {segments.map((s, i) =>
        s.match ? (
          <mark key={i} className="rounded-[2px] bg-crimson-dim px-px text-gold-bright">
            {s.text}
          </mark>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </>
  );
}

/** One search result: episode/timestamp header, highlighted snippet, and expandable surrounding context. */
export function ResultCard({
  episode,
  line,
  query,
  relatedTerms,
}: {
  episode: Episode;
  line: FlatLine;
  query: string;
  relatedTerms: string[] | null;
}) {
  const [open, setOpen] = useState(false);
  const [before, setBefore] = useState(CONTEXT_STEP);
  const [after, setAfter] = useState(CONTEXT_STEP);

  const snippetSegments = relatedTerms ? highlightAny(line.text, relatedTerms) : highlight(line.text, query);
  const startIdx = Math.max(0, line.lineIndex - before);
  const endIdx = Math.min(episode.lines.length - 1, line.lineIndex + after);
  const contextLines = episode.lines.slice(startIdx, endIdx + 1);

  return (
    <div className={"mb-3 overflow-hidden rounded-[3px] border border-line bg-panel" + (relatedTerms ? " [&_mark]:bg-transparent [&_mark]:text-gold [&_mark]:underline [&_mark]:decoration-crimson-dim" : "")}>
      <div className="flex cursor-pointer items-baseline justify-between gap-3 px-4 py-3 hover:bg-gold/5" onClick={() => setOpen((o) => !o)}>
        <span>
          <span className="mr-1.5 rounded-[2px] border border-line px-1.5 py-px font-ibm-plex-mono text-[9px] tracking-[0.08em] text-dim uppercase">
            {SERIES_LABEL[episode.series] ?? episode.series}
          </span>
          <span className="font-oswald text-[13px] font-semibold tracking-[0.04em] text-gold uppercase">{episode.title}</span>
        </span>
        <span className="flex items-center gap-2 text-nowrap font-ibm-plex-mono text-[11px] text-dim">
          {relatedTerms && <span className="rounded-[2px] border border-crimson-dim px-1.5 py-px text-[9px] text-crimson uppercase tracking-[0.08em]">related</span>}
          {fmtTime(line.start)}
        </span>
      </div>
      <div className="px-4 pb-3.5 text-[15px] text-ink">
        <Highlighted segments={snippetSegments} />
      </div>
      {open && (
        <div className="border-t border-line bg-black/20 px-4 py-3.5">
          {contextLines.map((l, i) => {
            const idx = startIdx + i;
            const isHit = idx === line.lineIndex;
            return (
              <div
                key={idx}
                className={"mb-1.5 border-l-2 pl-2 text-sm " + (isHit ? "border-gold font-semibold text-ink" : "border-line text-dim")}
              >
                <span className="mr-2 font-ibm-plex-mono text-[11px] text-dim">{fmtTime(l.start)}</span>
                {l.text}
              </div>
            );
          })}
          <div className="mt-2.5 flex justify-between font-ibm-plex-mono text-[11px]">
            <button
              type="button"
              disabled={startIdx === 0}
              onClick={() => setBefore((b) => b + CONTEXT_STEP)}
              className="rounded-[2px] border border-line px-2.5 py-1.5 text-gold transition-colors hover:border-gold-bright hover:text-gold-bright disabled:cursor-default disabled:opacity-35"
            >
              &uarr; more before
            </button>
            {episode.url && (
              <a
                href={episode.url.includes("?") ? `${episode.url}&t=${Math.floor(line.start)}s` : `${episode.url}?t=${Math.floor(line.start)}s`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-[2px] border border-line px-2.5 py-1.5 text-gold no-underline transition-colors hover:border-gold-bright hover:text-gold-bright"
              >
                watch on YouTube
              </a>
            )}
            <button
              type="button"
              disabled={endIdx === episode.lines.length - 1}
              onClick={() => setAfter((a) => a + CONTEXT_STEP)}
              className="rounded-[2px] border border-line px-2.5 py-1.5 text-gold transition-colors hover:border-gold-bright hover:text-gold-bright disabled:cursor-default disabled:opacity-35"
            >
              &darr; more after
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
