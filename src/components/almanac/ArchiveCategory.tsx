import { ArchiveItem } from "./ArchiveItem";
import type { ArchiveCategory as ArchiveCategoryData } from "@/types/almanac";

/** One collapsible feature category. Doesn't yet render nested `subs` groups -- see .claude/CODING-STANDARDS.md's almanac notes. */
export function ArchiveCategory({ category }: { category: ArchiveCategoryData }) {
  return (
    <details className="mb-2 overflow-hidden rounded-[3px] border border-line bg-panel">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none hover:bg-gold/5 [&::-webkit-details-marker]:hidden">
        <span className={"font-oswald text-[13px] font-semibold tracking-[0.05em] uppercase " + (category.ready ? "text-gold" : "text-dim")}>
          {category.label}
        </span>
        <span className="shrink-0 font-ibm-plex-mono text-[11px] text-dim">▸</span>
      </summary>
      <div className="border-t border-line bg-black/20 px-3 py-2.5">
        {!category.ready ? (
          <div className="px-1 py-1 font-ibm-plex-mono text-xs tracking-[0.05em] text-dim">coming soon</div>
        ) : (
          // Item names aren't guaranteed unique within a category in the source data -- index is fine, this list is static.
          category.items.map((item, i) => <ArchiveItem key={i} item={item} />)
        )}
      </div>
    </details>
  );
}
