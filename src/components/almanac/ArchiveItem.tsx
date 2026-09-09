import { archiveStatusClass, archiveStatusLabel, plainDescAndCites, splitDescIntoBullets } from "@/lib/almanac/archiveText";
import { CitationChip } from "./CitationChip";
import type { ArchiveItem as ArchiveItemData } from "@/types/almanac";

const STATUS_COLOR: Record<ReturnType<typeof archiveStatusClass>, string> = {
  complete: "text-gold-bright border-gold-bright",
  wip: "text-[#8fb3d9] border-[#8fb3d9]",
  partial: "text-[#c9a15a] border-[#c9a15a]",
  pivoted: "text-[#e06666] border-[#e06666]",
};

/** One feature/item row: name + status, expanding to its description (as a citation timeline, or a plain paragraph) on click. */
export function ArchiveItem({ item }: { item: ArchiveItemData }) {
  const bullets = splitDescIntoBullets(item.desc);
  const statusKey = archiveStatusClass(item.status);

  return (
    <details className="border-b border-line last:border-b-0">
      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-2.5 px-2 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="font-serif text-sm text-ink transition-colors hover:text-gold-bright">{item.name}</span>
        <span className={"shrink-0 rounded-[2px] border px-[7px] py-0.5 font-ibm-plex-mono text-[9px] tracking-[0.08em] uppercase " + STATUS_COLOR[statusKey]}>
          {archiveStatusLabel(item.status)}
        </span>
      </summary>
      <div className="px-2 pb-3">
        {bullets ? (
          <ul className="m-0 list-none p-0">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-baseline gap-2.5 border-b border-dashed border-line py-1.5 last:border-b-0">
                <span className="flex-1 text-[13.5px] text-ink">{b.text}</span>
                <span className="flex shrink-0 flex-wrap gap-1">
                  {b.cr.map((c) => (
                    <CitationChip key={c} citation={c} link={item.citationLinks?.[c]} />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          (() => {
            const { text, cites } = plainDescAndCites(item.desc);
            return (
              <>
                <div className="mb-2 text-[13.5px] leading-relaxed text-ink">{text}</div>
                <div className="flex flex-wrap gap-1.5">
                  {cites.map((c) => (
                    <CitationChip key={c} citation={c} link={item.citationLinks?.[c]} />
                  ))}
                </div>
              </>
            );
          })()
        )}
      </div>
    </details>
  );
}
