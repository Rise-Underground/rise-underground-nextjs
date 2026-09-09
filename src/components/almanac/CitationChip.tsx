import { citeSourceToken } from "@/lib/almanac/archiveText";
import type { CitationLink } from "@/types/almanac";

/**
 * A citation tag, colored by source series (CR/OP/AMA/T-Doc/DGC). Verified (a human confirmed the
 * link) renders filled solid; unverified renders outlined and fills on hover -- either way it's a
 * link if a url exists.
 */
export function CitationChip({ citation, link }: { citation: string; link: CitationLink | undefined }) {
  const verified = link?.verified === true;
  const title = verified
    ? "Verified — a human confirmed this links to the right moment"
    : link?.url
      ? "Not yet verified by a human"
      : "Not yet linked or verified";
  const label = (verified ? "✓ " : "") + citation;

  const style = { "--cite-color": citeSourceToken(citation) } as React.CSSProperties;
  const className = verified
    ? "inline-block rounded-[2px] border border-(--cite-color) bg-(--cite-color) px-[7px] py-px font-ibm-plex-mono text-[11.5px] text-void tracking-[0.05em] no-underline transition-colors hover:opacity-80"
    : "inline-block rounded-[2px] border border-(--cite-color) px-[7px] py-px font-ibm-plex-mono text-[11.5px] text-(--cite-color) tracking-[0.05em] no-underline transition-colors hover:bg-(--cite-color) hover:text-void";

  if (link?.url) {
    return (
      <a href={link.url} target="_blank" rel="noopener noreferrer" title={title} style={style} className={className}>
        {label}
      </a>
    );
  }

  return (
    <span title={title} style={style} className={className}>
      {label}
    </span>
  );
}
