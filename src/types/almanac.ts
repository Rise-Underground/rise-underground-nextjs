export type ArchiveStatus = "Complete" | "WIP" | "Partial Completion" | "Pivoted" | "Cancelled";

export interface CitationLink {
  url: string | null;
  verified: boolean;
}

export interface ArchiveItem {
  name: string;
  desc: string;
  status: ArchiveStatus;
  // Missing entirely on at least one real item in the archive data -- always guard access.
  citationLinks?: Record<string, CitationLink>;
}

export interface ArchiveCategory {
  id: string;
  label: string;
  ready: boolean;
  items: ArchiveItem[];
}

export type Series = "cafe_rise" | "origin_point" | "ama";

export interface TranscriptLine {
  start: number;
  duration?: number;
  text: string;
}

export interface Episode {
  title: string;
  url: string;
  series: Series;
  number: number | null;
  lines: TranscriptLine[];
}

/** One transcript line, flattened with a pointer back to its episode -- what search actually operates over. */
export interface FlatLine {
  epIndex: number;
  lineIndex: number;
  start: number;
  text: string;
}

export interface ManifestFile {
  /** e.g. "Cafe Rise Episode 12.json" */
  filename: string;
  /** Episode number for numbered series, null for AMAs. */
  number: number | null;
  /** Display title if it differs from the default "<Label> <number>" (e.g. "part 2"). */
  title?: string;
}

export interface AlmanacManifest {
  cafeRise: ManifestFile[];
  originPoint: ManifestFile[];
  amas: ManifestFile[];
}
