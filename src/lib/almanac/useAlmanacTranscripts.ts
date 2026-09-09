import { useEffect, useState } from "react";
import { oldSiteAssetUrl, SOURCE_PATHS } from "@/lib/data/source";
import type { AlmanacManifest, Episode, FlatLine, ManifestFile, Series } from "@/types/almanac";

interface RawTranscriptFile {
  title?: string;
  url?: string;
  transcript?: { start: number; duration?: number; text: string }[];
}

interface SeriesConfig {
  key: Series;
  label: string;
  folder: string;
}

const SERIES_CONFIG: SeriesConfig[] = [
  { key: "cafe_rise", label: "Cafe Rise", folder: SOURCE_PATHS.transcriptSeries.cafeRise },
  { key: "origin_point", label: "Origin Point", folder: SOURCE_PATHS.transcriptSeries.originPoint },
  { key: "ama", label: "AMAs", folder: SOURCE_PATHS.transcriptSeries.amas },
];

async function fetchEpisode(folder: string, file: ManifestFile): Promise<RawTranscriptFile | null> {
  try {
    const path = folder
      .split("/")
      .map(encodeURIComponent)
      .concat(encodeURIComponent(file.filename))
      .join("/");
    const res = await fetch(oldSiteAssetUrl(`${SOURCE_PATHS.transcriptsDir}/${path}`));
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

interface State {
  episodes: Episode[];
  allLines: FlatLine[];
  counts: Record<Series, number>;
  loading: boolean;
}

/**
 * Loads every episode's full transcript (cafe_rise + origin_point + AMAs) into memory, client-side
 * -- required for the original's instant full-text search across everything at once. The episode
 * *list* comes from our cached manifest route (see api/almanac/manifest/route.ts) instead of the
 * original's per-visitor probing; the transcript *content* is still fetched directly from the old
 * site, same as the original page fetched its local files.
 */
export function useAlmanacTranscripts(): State {
  const [state, setState] = useState<State>({
    episodes: [],
    allLines: [],
    counts: { cafe_rise: 0, origin_point: 0, ama: 0 },
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const manifestRes = await fetch("/api/almanac/manifest").catch(() => null);
      if (!manifestRes || !manifestRes.ok) {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
        return;
      }
      const manifest: AlmanacManifest = await manifestRes.json();
      const filesBySeries: Record<Series, ManifestFile[]> = {
        cafe_rise: manifest.cafeRise,
        origin_point: manifest.originPoint,
        ama: manifest.amas,
      };

      const episodes: Episode[] = [];
      const allLines: FlatLine[] = [];
      const counts: Record<Series, number> = { cafe_rise: 0, origin_point: 0, ama: 0 };

      for (const cfg of SERIES_CONFIG) {
        const files = filesBySeries[cfg.key];
        const loaded = await Promise.all(files.map((f) => fetchEpisode(cfg.folder, f)));
        loaded.forEach((data, idx) => {
          if (!data) return;
          const file = files[idx];
          const fallbackTitle = file.title ? `${cfg.label} ${file.number} ${file.title}` : `${cfg.label} ${file.number ?? ""}`.trim();
          const epIndex = episodes.length;
          episodes.push({
            title: data.title || fallbackTitle,
            url: data.url || "",
            series: cfg.key,
            number: file.number,
            lines: data.transcript || [],
          });
          (data.transcript || []).forEach((line, lineIndex) => {
            allLines.push({ epIndex, lineIndex, start: line.start, text: line.text });
          });
          counts[cfg.key]++;
        });
      }

      if (!cancelled) setState({ episodes, allLines, counts, loading: false });
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
