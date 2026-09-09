import type { NftItem } from "@/types/poaTracker";

/** Top 3 items by best current Mythic odds across either chain. */
export function TopMintsHeader({ items }: { items: NftItem[] }) {
  const ranked = items
    .filter((it) => it.best_mythic && it.best_mythic.pct > 0)
    .sort((a, b) => b.best_mythic!.pct - a.best_mythic!.pct)
    .slice(0, 3);

  if (ranked.length === 0) return null;

  return (
    <div className="mb-7 overflow-hidden rounded-[10px] border border-line bg-panel">
      <div className="border-b border-line px-[22px] py-4.5">
        <h2 className="font-ibm-plex-mono text-[13px] font-semibold tracking-[0.5px] text-ink uppercase">Best Mythic Odds Right Now</h2>
      </div>
      <div className="grid grid-cols-1 gap-px bg-line min-[900px]:grid-cols-3">
        {ranked.map((it, i) => (
          <div key={it.key} className="flex flex-col gap-1 bg-panel px-5 py-4">
            <span className="font-ibm-plex-mono text-[11px] tracking-[1px] text-dim uppercase">#{i + 1}</span>
            <span className="font-oswald text-[15px] font-semibold tracking-[0.02em] text-ink uppercase">{it.name}</span>
            <span className="font-ibm-plex-mono text-[11px] text-dimmer">{it.best_mythic!.chain}</span>
            <span className="font-ibm-plex-mono text-xl font-bold text-[#f2c057] [text-shadow:0_0_8px_rgba(242,192,87,0.5)]">
              {it.best_mythic!.pct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
