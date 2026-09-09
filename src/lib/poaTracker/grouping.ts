import type { NftItem } from "@/types/poaTracker";

export interface BundleGroup {
  name: string;
  members: NftItem[];
}

/**
 * Splits the flat item list into standalone solo cards and bundle groups. A bundle member that's
 * both not bundle-exclusive and independently sold also gets its own standalone solo card (it's
 * really buyable either way).
 */
export function groupItems(items: NftItem[]): { soloItems: NftItem[]; bundles: BundleGroup[] } {
  const rendered = new Set<string>();
  const soloItems: NftItem[] = [];
  const bundles: BundleGroup[] = [];

  for (const it of items) {
    if (rendered.has(it.key)) continue;
    if (it.bundle) {
      const members = items.filter((x) => x.bundle === it.bundle);
      members.forEach((m) => rendered.add(m.key));
      bundles.push({ name: it.bundle, members });
      members
        .filter((m) => m.bundle_exclusive === false && m.solo_sale)
        .forEach((m) => soloItems.push(m));
    } else {
      rendered.add(it.key);
      soloItems.push(it);
    }
  }

  return { soloItems, bundles };
}
