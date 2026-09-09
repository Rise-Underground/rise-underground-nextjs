const AFFILIATE_PARAM = "alc=duLb64P7HB";

export function affiliateUrl(baseUrl: string | null): string | null {
  if (!baseUrl) return null;
  return baseUrl + (baseUrl.includes("?") ? "&" : "?") + AFFILIATE_PARAM;
}

export function slugifyForBundle(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function formatAgo(seconds: number): string {
  if (seconds < 60) return "just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
