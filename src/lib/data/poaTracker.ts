import Papa from "papaparse";
import { fetchSourceFile, SOURCE_PATHS } from "./source";
import type { BundleSummary, NftItem, RecentMint } from "@/types/poaTracker";

interface MintStatusRow {
  key?: string;
  url?: string;
  open?: string | boolean;
}

export interface PoaTrackerData {
  items: NftItem[];
  bundleSummaries: Record<string, BundleSummary>;
  recentMints: RecentMint[];
  generatedAt: string | null;
  itemUrls: Record<string, string>;
  error: string | null;
}

const EMPTY: PoaTrackerData = {
  items: [],
  bundleSummaries: {},
  recentMints: [],
  generatedAt: null,
  itemUrls: {},
  error: null,
};

/**
 * Loads NFT items + mint-status together, then filters and sorts them: items are filtered down to
 * currently-open mints (if the status CSV has any), then ordered by store listing position --
 * items with no matching status row sort to the end, in whatever order they arrived, rather than
 * disappearing.
 */
export async function fetchPoaTrackerData(): Promise<PoaTrackerData> {
  let itemsRaw: NftItem[] = [];
  const bundleSummaries: Record<string, BundleSummary> = {};
  let recentMints: RecentMint[] = [];
  let generatedAt: string | null = null;

  try {
    const { text } = await fetchSourceFile(SOURCE_PATHS.nftData);
    const data = JSON.parse(text);
    itemsRaw = Array.isArray(data.items) ? data.items : [];
    recentMints = Array.isArray(data.recent_mints) ? data.recent_mints : [];
    generatedAt = data.generated_at ?? null;
    (Array.isArray(data.bundle_summaries) ? data.bundle_summaries : []).forEach((b: BundleSummary) => {
      bundleSummaries[b.name] = b;
    });
  } catch (err) {
    return { ...EMPTY, error: err instanceof Error ? err.message : "Unknown error" };
  }

  const itemUrls: Record<string, string> = {};
  const itemOrder = new Map<string, number>();
  let openKeys = new Set<string>();
  try {
    const { text: csvText } = await fetchSourceFile(SOURCE_PATHS.nftMintStatus);
    const { data: rows } = Papa.parse<MintStatusRow>(csvText, { header: true, skipEmptyLines: true });
    rows.forEach((r, i) => {
      const key = r.key ? String(r.key).trim() : "";
      if (!key) return;
      const isOpen = r.open === true || String(r.open).trim().toLowerCase() === "true";
      if (r.url) itemUrls[key] = String(r.url).trim();
      itemOrder.set(key, i);
      if (isOpen) openKeys.add(key);
    });
  } catch {
    // status file missing/unreachable -- fall through with openKeys empty, showing everything
    openKeys = new Set();
  }

  let items = openKeys.size > 0 ? itemsRaw.filter((it) => openKeys.has(it.key)) : itemsRaw;
  items = items
    .map((it, i) => ({ it, i, order: itemOrder.has(it.key) ? itemOrder.get(it.key)! : Infinity }))
    .sort((a, b) => a.order - b.order || a.i - b.i)
    .map((x) => x.it);

  return { items, bundleSummaries, recentMints, generatedAt, itemUrls, error: null };
}
