"use client";

import { useMemo, useState } from "react";

export interface SearchTarget {
  id: string;
  name: string;
  isBundle: boolean;
}

/**
 * Name search over items + bundles. Picking a result scrolls to and briefly highlights the
 * matching card. Doesn't separately target individual bundle-exclusive members -- they're still
 * visible inside their bundle's card, just not a distinct search target.
 */
export function PoaSearchBox({ targets, onSelect }: { targets: SearchTarget[]; onSelect: (target: SearchTarget) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return targets.filter((t) => t.name.toLowerCase().includes(q)).slice(0, 10);
  }, [query, targets]);

  function pick(target: SearchTarget) {
    onSelect(target);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative mx-auto mb-7 max-w-[420px]">
      <input
        type="text"
        value={query}
        autoComplete="off"
        placeholder="Find an NFT by name…"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => query && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full rounded-lg border border-line bg-panel px-3.5 py-2.5 font-ibm-plex-mono text-[13px] text-ink outline-none placeholder:text-dimmer focus:border-gold"
      />
      {open && query.trim() && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-[15] max-h-[280px] overflow-y-auto rounded-lg border border-line bg-panel shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
          {matches.length === 0 ? (
            <div className="p-3 font-ibm-plex-mono text-xs text-dimmer">No NFT matches &quot;{query}&quot;</div>
          ) : (
            matches.map((m) => (
              <button
                key={m.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(m);
                }}
                className="block w-full border-b border-line px-3.5 py-2.5 text-left font-ibm-plex-mono text-[12.5px] text-ink last:border-b-0 hover:bg-panel-2 hover:text-gold-bright"
              >
                {m.name}
                {m.isBundle && <span className="text-dimmer"> (Bundle)</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
