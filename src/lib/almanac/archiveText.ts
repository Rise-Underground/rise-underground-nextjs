import type { ArchiveStatus } from "@/types/almanac";

export function archiveStatusClass(status: string): "complete" | "wip" | "partial" | "pivoted" {
  const s = status.toLowerCase();
  if (s === "complete") return "complete";
  if (s === "wip") return "wip";
  if (s.startsWith("partial")) return "partial";
  if (s === "pivoted" || s.startsWith("cancelled")) return "pivoted";
  return "wip";
}

/** Cancelled/Scrapped is merged into Pivoted for display purposes. */
export function archiveStatusLabel(status: string): string {
  return status.toLowerCase().startsWith("cancelled") ? "Pivoted" : status;
}

/** Maps a citation code to its source series color token, so each series renders in its own color. */
export function citeSourceToken(citation: string): string {
  if (/^CR\d/i.test(citation)) return "var(--color-cite-cr)";
  if (/^OP\d/i.test(citation)) return "var(--color-cite-op)";
  if (/AMA/i.test(citation)) return "var(--color-cite-ama)";
  if (/^T-Doc/i.test(citation)) return "var(--color-cite-tdoc)";
  if (/^DGC/i.test(citation)) return "var(--color-cite-dgc)";
  return "var(--color-cite-default)";
}

interface DescGroup {
  start: number;
  end: number;
  ccs: string[];
}

const CITE_GROUP_PATTERN = /\(((?:CR\d+|CC\d+|OP\d+|AMA\w*|T-Doc|DGC\w*)(?:,\s*(?:CR\d+|CC\d+|OP\d+|AMA\w*|T-Doc|DGC\w*))*)\)/g;

/** Finds every inline citation grouping like "(CR62)" or "(CR75, CR83)" in a description. */
export function parseDescGroups(desc: string): DescGroup[] {
  const groups: DescGroup[] = [];
  const pattern = new RegExp(CITE_GROUP_PATTERN);
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(desc)) !== null) {
    groups.push({ start: match.index, end: match.index + match[0].length, ccs: match[1].split(",").map((s) => s.trim()) });
  }
  return groups;
}

export interface DescBullet {
  text: string;
  cr: string[];
}

/**
 * Splits a description into timeline bullets wherever a citation grouping appears mid-text. A
 * final group that only repeats citations already used earlier is treated as a redundant summary
 * and dropped. Returns null when there's nothing to split (render as a plain paragraph instead).
 */
export function splitDescIntoBullets(desc: string): DescBullet[] | null {
  const groups = parseDescGroups(desc);
  if (groups.length < 2) return null;

  const last = groups[groups.length - 1];
  const unionBefore = new Set(groups.slice(0, -1).flatMap((g) => g.ccs));
  const lastIsSubset = last.ccs.every((c) => unionBefore.has(c));
  const trailingText = desc.slice(last.end).trim();
  const usableGroups = lastIsSubset && trailingText === "" ? groups.slice(0, -1) : groups;
  if (usableGroups.length < 2) return null;

  const bullets: DescBullet[] = [];
  let cursor = 0;
  usableGroups.forEach((g) => {
    let segment = desc.slice(cursor, g.start).trim();
    segment = segment.replace(/^[;,.\s—-]+/, "").trim();
    if (segment) {
      if (/^[a-z]/.test(segment)) segment = segment[0].toUpperCase() + segment.slice(1);
      if (!/[.!?]$/.test(segment)) segment += ".";
      bullets.push({ text: segment, cr: g.ccs });
    }
    cursor = g.end;
  });
  let leftover = desc
    .slice(cursor)
    .trim()
    .replace(/^[;,.\s—-]+/, "")
    .trim();
  if (leftover) {
    if (!/[.!?]$/.test(leftover)) leftover += ".";
    bullets.push({ text: leftover, cr: [] });
  }
  return bullets.length > 1 ? bullets : null;
}

/** For items that don't split into bullets: the plain lead-in text plus every citation mentioned anywhere in the description. */
export function plainDescAndCites(desc: string): { text: string; cites: string[] } {
  const groups = parseDescGroups(desc);
  const allCites = Array.from(new Set(groups.flatMap((g) => g.ccs)));
  const text = groups.length ? desc.slice(0, groups[groups.length - 1].start).trim() : desc;
  return { text, cites: allCites };
}

export interface AlmanacStatusCounts {
  Complete: number;
  WIP: number;
  "Partial Completion": number;
  Pivoted: number;
}

/** Tallies item statuses across ready categories only (matching what's actually been reviewed so far). */
export function computeAlmanacStats(categories: { ready: boolean; items?: { status: ArchiveStatus }[]; subs?: { items: { status: ArchiveStatus }[] }[] }[]): AlmanacStatusCounts {
  const counts: AlmanacStatusCounts = { Complete: 0, WIP: 0, "Partial Completion": 0, Pivoted: 0 };
  function tally(items: { status: ArchiveStatus }[]) {
    items.forEach((it) => {
      let s: string = it.status || "";
      if (/^cancelled/i.test(s)) s = "Pivoted";
      if (s in counts) counts[s as keyof AlmanacStatusCounts]++;
    });
  }
  categories.forEach((cat) => {
    if (!cat.ready) return;
    if (cat.items) tally(cat.items);
    if (cat.subs) cat.subs.forEach((sub) => tally(sub.items));
  });
  return counts;
}
