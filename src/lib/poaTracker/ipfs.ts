import { oldSiteAssetUrl, SOURCE_PATHS } from "@/lib/data/source";

// ipfs.io alone is best-effort with no SLA and known to rate-limit or block hotlinked <img>
// requests -- try a few public gateways in order, falling back automatically.
export const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://nftstorage.link/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
];

export function ipfsCid(url: string | null): string | null {
  if (url && url.startsWith("ipfs://")) return url.slice("ipfs://".length);
  return null;
}

/**
 * Resolves an item's image field to an actual URL. IPFS references go through a gateway (by
 * index, for fallback); http(s) URLs pass through; a relative path like "images/foo.png" is
 * relative to NFT_Data/ on the *old* site, not this one -- we never mirrored those images here.
 */
export function ipfsToHttp(url: string | null, gatewayIndex: number): string | null {
  if (!url) return url;
  const cid = ipfsCid(url);
  if (cid) return IPFS_GATEWAYS[gatewayIndex] + cid;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return oldSiteAssetUrl(`${SOURCE_PATHS.nftAssetsDir}/${url}`);
}
