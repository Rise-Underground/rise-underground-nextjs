"use client";

import { useState } from "react";
import { IPFS_GATEWAYS, ipfsCid, ipfsToHttp } from "@/lib/poaTracker/ipfs";

/** An NFT image that cycles through IPFS gateways on load failure, falling back to a placeholder once all are exhausted. */
export function GatewayImage({
  src,
  alt,
  className,
  emptyLabel = "No image captured yet",
}: {
  src: string | null;
  alt: string;
  className?: string;
  emptyLabel?: string;
}) {
  const [gatewayIndex, setGatewayIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  const resolved = src ? ipfsToHttp(src, gatewayIndex) : null;
  const canRetry = ipfsCid(src) !== null && gatewayIndex < IPFS_GATEWAYS.length - 1;

  if (!src || failed || !resolved) {
    return (
      <div className={className + " flex items-center justify-center border border-dashed border-line bg-panel-2 p-4 text-center font-ibm-plex-mono text-[11px] text-dimmer"}>
        {emptyLabel}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- dynamic IPFS/old-site hosts, not worth Next's Image domain allowlist for a rotating gateway list
    <img
      src={resolved}
      alt={alt}
      className={className}
      onError={() => {
        if (canRetry) setGatewayIndex((i) => i + 1);
        else setFailed(true);
      }}
    />
  );
}
