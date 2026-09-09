import { NextResponse } from "next/server";
import { OLD_SITE_BASE, SOURCE_PATHS } from "@/lib/data/source";
import type { AlmanacManifest, ManifestFile } from "@/types/almanac";

// GitHub Pages has no directory-listing endpoint, so the original page discovered numbered
// episodes by probing "Episode 1", "2", 3"... from the browser, on every single page load, until
// 5 consecutive misses (capped at 300 tries). That's wasteful per-visitor. This route runs the
// exact same probe server-side instead, once per `revalidate` window (below), and every visitor
// gets the cached result -- same discovery logic, much less waste. The actual transcript content
// is still fetched client-side, straight from the old site (see useAlmanacTranscripts.ts).
export const revalidate = 3600;

const MAX_TRY = 300;
// One-at-a-time probing (the original's approach) is fine from a single visitor's browser, but
// far too slow run serially from a server route -- probed in parallel batches instead. A whole
// batch coming back empty is a much more generous stop condition than the original's "5
// consecutive misses," which only matters in that it can't falsely stop early; real episode runs
// are contiguous, so it finds exactly the same set.
const BATCH_SIZE = 20;

async function exists(path: string): Promise<boolean> {
  try {
    const res = await fetch(`${OLD_SITE_BASE}/${path}`, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

/** Checks one episode number: the plain filename, or -- if that's a miss -- its "part 1", "part 2", ... variants. */
async function checkEpisode(encodedFolder: string, filenameFor: (n: number) => string, n: number): Promise<ManifestFile[]> {
  const plainName = filenameFor(n);
  if (await exists(`${SOURCE_PATHS.transcriptsDir}/${encodedFolder}/${encodeURIComponent(plainName)}`)) {
    return [{ filename: plainName, number: n }];
  }

  const parts: ManifestFile[] = [];
  let part = 1;
  while (true) {
    const partName = filenameFor(n).replace(/\.json$/, ` part ${part}.json`);
    if (!(await exists(`${SOURCE_PATHS.transcriptsDir}/${encodedFolder}/${encodeURIComponent(partName)}`))) break;
    parts.push({ filename: partName, number: n, title: `Part ${part}` });
    part++;
  }
  return parts;
}

async function probeNumberedSeries(folder: string, filenameFor: (n: number) => string): Promise<ManifestFile[]> {
  const found: ManifestFile[] = [];
  const encodedFolder = folder.split("/").map(encodeURIComponent).join("/");

  for (let batchStart = 1; batchStart <= MAX_TRY; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, MAX_TRY);
    const numbers = Array.from({ length: batchEnd - batchStart + 1 }, (_, k) => batchStart + k);
    const results = await Promise.all(numbers.map((n) => checkEpisode(encodedFolder, filenameFor, n)));
    const flat = results.flat();
    if (flat.length === 0) break;
    found.push(...flat);
  }

  return found;
}

async function loadAmaManifest(): Promise<ManifestFile[]> {
  try {
    const res = await fetch(
      `${OLD_SITE_BASE}/${SOURCE_PATHS.transcriptsDir}/${SOURCE_PATHS.transcriptSeries.amas}/index.json`,
    );
    if (!res.ok) return [];
    const index = await res.json();
    const files: string[] = Array.isArray(index.files) ? index.files : [];
    return files.map((filename) => ({ filename, number: null }));
  } catch {
    return [];
  }
}

export async function GET() {
  const [cafeRise, originPoint, amas] = await Promise.all([
    probeNumberedSeries(SOURCE_PATHS.transcriptSeries.cafeRise, (n) => `Cafe Rise Episode ${n}.json`),
    probeNumberedSeries(SOURCE_PATHS.transcriptSeries.originPoint, (n) => `Origin Point Episode ${n}.json`),
    loadAmaManifest(),
  ]);

  const manifest: AlmanacManifest = { cafeRise, originPoint, amas };
  return NextResponse.json(manifest, {
    headers: { "Cache-Control": "public, max-age=0, must-revalidate, s-maxage=3600" },
  });
}
