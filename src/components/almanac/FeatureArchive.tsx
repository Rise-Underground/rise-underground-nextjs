import { ArchiveCategory } from "./ArchiveCategory";
import type { ArchiveCategory as ArchiveCategoryData } from "@/types/almanac";

const LEGEND: { key: string; label: string; color: string }[] = [
  { key: "CR#", label: "Cafe Rise / Copi Cafe", color: "var(--color-cite-cr)" },
  { key: "OP#", label: "Origin Point", color: "var(--color-cite-op)" },
  { key: "AMA", label: "Ask Me Anything", color: "var(--color-cite-ama)" },
  { key: "T-Doc", label: "Tokenomics Document", color: "var(--color-cite-tdoc)" },
  { key: "DGC", label: "Discord General Chat", color: "var(--color-cite-dgc)" },
];

/** Every feature the team has discussed on-air, organized by category, in two alternating columns. */
export function FeatureArchive({ categories }: { categories: ArchiveCategoryData[] }) {
  const left = categories.filter((_, i) => i % 2 === 0);
  const right = categories.filter((_, i) => i % 2 === 1);

  return (
    <section className="mx-auto mb-[70px] max-w-[1400px] px-6">
      <h2 className="mt-2 mb-2.5 pt-3.5 text-center font-oswald text-[clamp(28px,4vw,40px)] font-bold tracking-[0.06em] text-gold uppercase">
        Feature Archive
      </h2>
      <p className="mb-1.5 text-center font-serif text-[15px] text-dim">
        Every feature the team has talked about on-air, organized by category. Click a category to open it up.
      </p>
      <p className="mb-5 text-center font-ibm-plex-mono text-[11px] text-dim">
        If you see any inaccuracies, let us know by posting on X{" "}
        <a href="https://x.com/RiseUGX" target="_blank" rel="noopener noreferrer" className="text-gold underline decoration-crimson-dim">
          @RiseUGX
        </a>
        .
      </p>

      <div className="mx-auto mb-5 flex max-w-[720px] flex-col items-center gap-2 rounded-md border border-line bg-panel px-5 py-3">
        <div className="font-oswald text-[11px] font-semibold tracking-[0.14em] text-gold uppercase">Citation Key</div>
        <div className="flex flex-wrap justify-center gap-x-5.5 gap-y-2.5">
          {LEGEND.map((l) => (
            <span key={l.key} className="flex items-center gap-2 font-ibm-plex-mono text-[11.5px] text-dim">
              <span
                className="rounded-[2px] border px-[7px] py-px font-semibold tracking-[0.05em]"
                style={{ borderColor: l.color, color: l.color }}
              >
                {l.key}
              </span>
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-start gap-4 md:flex-row">
        <div className="min-w-0 flex-1">
          {left.map((cat) => (
            <ArchiveCategory key={cat.id} category={cat} />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          {right.map((cat) => (
            <ArchiveCategory key={cat.id} category={cat} />
          ))}
        </div>
      </div>
    </section>
  );
}
